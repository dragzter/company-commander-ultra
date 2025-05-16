export type Trait = {
  morale: {
    positive: number;
    negative: number;
  };
  initiative: {
    positive: number;
    negative: number;
  };
  defense: {
    positive: number;
    negative: number;
  };
  offense: {
    positive: number;
    negative: number;
  };
  logistics: {
    positive: number;
    negative: number;
  };
};

export type Unit = {
  name: string;
  motto: string;
  nickname: string;
  allegiance: string;
  id: string;
  traits: Trait[];
};

export type FactionAttribute = {
  key: string;
  affected_by: {
    positive: string[];
    negative: string[];
  };
};

export type ElOptions = {
  classes?: string[];
  id?: string;
  src?: string;
  attributes?: {
    [key: string]: string;
  };
};

export type BtnOptions = {
  text: string;
  cb?: (e: Event) => void;
  event?: string;
  classes?: string[];
  id?: string;
  sound?: string;
};

// Menu buttons
export type MBtnOptions = {
  text: string;
  cb?: (e: Event) => void;
  event?: string;
  color: string;
  classes?: string[];
  id?: string;
  sound?: string;
};

export type HandlerInitConfig = {
  eventType: keyof HTMLElementEventMap;
  selector: string;
  callback: EventListener;
};
