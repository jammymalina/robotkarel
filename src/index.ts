import store from './store';
import * as blocklyToolboxXml from './config/blockly/toolbox/basic.xml';
import * as blocklyConfig from './config/blockly/config.json';

window.addEventListener('load', (ev: Event) => {
  const workspace = document.getElementById('workspace');
  const blocklyWorkspace = document.getElementById('blocklyWorkspace');
  const board = <HTMLCanvasElement> document.getElementById('board');

  const gl = board.getContext('webgl2', { antialias: false });

  const isWebglAvailable = !!gl;

  console.log('WebGL2 available: ', isWebglAvailable);

  let resizeTimer = 0;
  const RESIZE_DELAY_MS = 250;

  const options = {
    ...blocklyConfig,
    toolbox: blocklyToolboxXml
  };
  
  const workspacePlayground = Blockly.inject(blocklyWorkspace, options);

  workspacePlayground.addChangeListener((ev: BlocklyEvent) => {
    console.log(ev);
  });

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

      board.width = window.innerWidth;
      board.height = window.innerHeight;

      Blockly.svgResize(workspacePlayground);
    }, RESIZE_DELAY_MS);
  }, false);

  window.dispatchEvent(new Event('resize'));
});
