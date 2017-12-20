declare module '*.json' {
  const value: any;
  export default value;
}

declare module '*.xml' {
  const content: string;
  export default content;
}

declare var Blockly: any;

declare interface BlocklyEvent {
  type: string;
  blockId?: string;
  group?: string;
  [propName: string]: any;    
}
