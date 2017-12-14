import * as blocklyToolboxXml from './config/blockly/toolbox/basic.xml';

window.addEventListener('load', (ev: Event) => {
  const workspace = document.getElementById('workspace');
  const blocklyWorkspace = document.getElementById('blocklyWorkspace');

  let resizeTimer: number = null;
  const RESIZE_DELAY_MS = 500;

  const options = {
    comments: true,
    collapse: true,
    media: './src/scratch-blocks/media/',
    oneBasedIndex: true,
    readOnly: false,
    scrollbars: true,
    trashcan: true,
    zoom: {
      controls: true,
      wheel: true,
      startScale: 1.0,
      maxScale: 4,
      minScale: 0.25,
      scaleSpeed: 1.1
    },
    rtl: false,
    toolbox: blocklyToolboxXml,
    horizontalLayout: true,
    toolboxPosition: 'start'
  };

  const workspacePlayground = Blockly.inject(blocklyWorkspace, options);

  console.log(Blockly);

  window.addEventListener('resize', (ev: UIEvent) => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      let element = workspace;
      let x = 0;
      let y = 0;
      do {
        x += element.offsetLeft;
        y += element.offsetTop;
        element = <HTMLElement> element.offsetParent;
      } while (element);
      blocklyWorkspace.style.left = x + 'px';
      blocklyWorkspace.style.top = y + 'px';
      blocklyWorkspace.style.width = workspace.offsetWidth + 'px';
      blocklyWorkspace.style.height = workspace.offsetHeight + 'px';
      Blockly.svgResize(workspacePlayground);  
    }, RESIZE_DELAY_MS);
  }, false);

  window.dispatchEvent(new Event('resize'));

});
