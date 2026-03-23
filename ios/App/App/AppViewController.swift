import UIKit
import Capacitor
import WebKit

class AppViewController: CAPBridgeViewController {
    private var nativeSplashWindow: UIWindow?
    private var readyPollTimer: Timer?
    private var splashStartAt: Date?
    private let maxSplashDuration: TimeInterval = 12.0

    override func viewDidLoad() {
        showNativeSplashWindowIfNeeded()
        super.viewDidLoad()
        view.backgroundColor = UIColor(red: 0.027, green: 0.051, blue: 0.082, alpha: 1.0)
        tuneWebViewBackground()
        startReadyPolling()
    }

    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        showNativeSplashWindowIfNeeded()
        tuneWebViewBackground()
        startReadyPolling()
    }

    deinit {
        readyPollTimer?.invalidate()
        readyPollTimer = nil
    }

    private func tuneWebViewBackground() {
        guard let webView = bridge?.webView else { return }
        webView.isOpaque = false
        webView.backgroundColor = UIColor.clear
        webView.scrollView.backgroundColor = UIColor.clear
    }

    private func showNativeSplashWindowIfNeeded() {
        if nativeSplashWindow != nil { return }
        let windowScene = (view.window?.windowScene
            ?? UIApplication.shared.connectedScenes
                .compactMap { $0 as? UIWindowScene }
                .first)
        guard let scene = windowScene else { return }

        let splashWindow = UIWindow(windowScene: scene)
        splashWindow.frame = scene.coordinateSpace.bounds
        splashWindow.windowLevel = UIWindow.Level.normal + 1

        let rootVC = UIViewController()
        rootVC.view.backgroundColor = UIColor(red: 0.027, green: 0.051, blue: 0.082, alpha: 1.0)

        let overlay = rootVC.view!

        let stack = UIStackView()
        stack.axis = .vertical
        stack.alignment = .center
        stack.spacing = 10
        stack.translatesAutoresizingMaskIntoConstraints = false

        let logo = UIImageView(image: UIImage(named: "Splash"))
        logo.translatesAutoresizingMaskIntoConstraints = false
        logo.contentMode = .scaleAspectFit
        logo.clipsToBounds = true

        let title = UILabel()
        title.translatesAutoresizingMaskIntoConstraints = false
        title.text = "FIRETEAM LEADER"
        title.font = UIFont.monospacedSystemFont(ofSize: 18, weight: .bold)
        title.textColor = UIColor(white: 0.94, alpha: 0.98)
        title.textAlignment = .center

        stack.addArrangedSubview(logo)
        stack.addArrangedSubview(title)
        overlay.addSubview(stack)
        splashWindow.rootViewController = rootVC
        splashWindow.isHidden = false

        NSLayoutConstraint.activate([
            stack.centerXAnchor.constraint(equalTo: overlay.centerXAnchor),
            stack.centerYAnchor.constraint(equalTo: overlay.centerYAnchor),
            stack.leadingAnchor.constraint(greaterThanOrEqualTo: overlay.leadingAnchor, constant: 20),
            stack.trailingAnchor.constraint(lessThanOrEqualTo: overlay.trailingAnchor, constant: -20),

            logo.widthAnchor.constraint(lessThanOrEqualToConstant: 300),
            logo.widthAnchor.constraint(greaterThanOrEqualToConstant: 180),
            logo.heightAnchor.constraint(equalTo: logo.widthAnchor, multiplier: 0.95)
        ])

        nativeSplashWindow = splashWindow
        splashStartAt = Date()
    }

    private func startReadyPolling() {
        if readyPollTimer != nil { return }
        readyPollTimer = Timer.scheduledTimer(withTimeInterval: 0.1, repeats: true) { [weak self] _ in
            self?.checkAndDismissOverlay()
        }
    }

    private func checkAndDismissOverlay() {
        let timedOut = splashStartAt.map { Date().timeIntervalSince($0) >= maxSplashDuration } ?? false
        guard timedOut || isWebViewReady() else { return }

        readyPollTimer?.invalidate()
        readyPollTimer = nil

        guard let splashWindow = nativeSplashWindow else { return }
        UIView.animate(withDuration: 0.22, animations: {
            splashWindow.alpha = 0
        }, completion: { _ in
            splashWindow.isHidden = true
        })
        nativeSplashWindow = nil
    }

    private func isWebViewReady() -> Bool {
        guard let webView = bridge?.webView else { return false }
        return webView.url != nil && !webView.isLoading
    }
}
