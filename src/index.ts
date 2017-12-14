import * as blocklyToolboxXml from './config/blockly/toolbox/basic.xml';

window.addEventListener('load', (ev: Event) => {
  console.log(blocklyToolboxXml);

  const options = {
    comments: true,
    collapse: true,
    media: './src/scratch-blocks/media/',
    oneBasedIndex: true,
    readOnly: false,
    //rtl: false,
    scrollbars: true,
    trashcan: true,
    //toolbox: null,
    //horizontalLayout: false,
    //toolboxPosition: 'start',
    zoom: {
      controls: true,
      wheel: true,
      startScale: 1.0,
      maxScale: 4,
      minScale: 0.25,
      scaleSpeed: 1.1
    },
    rtl: true,
    toolbox: blocklyToolboxXml,
    horizontalLayout: true,
    toolboxPosition: 'start'
  };

  console.log(Blockly);

  Blockly.inject('blocklyWorkspace', options);
});
