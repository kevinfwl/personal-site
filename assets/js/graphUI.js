// Preserve the algorithms' relative pacing at 3x speed, batching small steps
// within animation frames so the browser's minimum timeout does not slow them.
const GENERATION_SPEED = 3;
let generationStep = null;
let generationDue = 0;
let generationFrame = null;
let processingGeneration = false;
function scheduleGenerationStep(callback, delay) {
  if (!processingGeneration) generationDue = performance.now();
  generationDue += delay / GENERATION_SPEED;
  generationStep = callback;
  if (!processingGeneration && generationFrame === null) {
    generationFrame = requestAnimationFrame(runGenerationSteps);
  }
}
function runGenerationSteps(now) {
  generationFrame = null;
  processingGeneration = true;
  let steps = 0;
  while (generationStep && generationDue <= now && steps++ < 1000) {
    const step = generationStep;
    generationStep = null;
    step();
  }
  processingGeneration = false;
  if (generationStep) generationFrame = requestAnimationFrame(runGenerationSteps);
}
const PATH=" ",WALL="#",SEARCH_PATH="=";var NODE_SIZE=10;const PATH_COLOR="#1b1b1b",BLOCK_COLOR="#0f0f0f",STANDBY_COLOR="#3d0b0b",SEARCHED_COLOR="#0c1f29",FINAL_PATH_COLOR="#0f2e0d",ctx=document.getElementById("grid").getContext("2d");var state,numNodes=0,needResizing=!1,curMazeGenAlgo=0;function Point(e,t){this.x=e,this.y=t}function Tree(e,t){this.x=e,this.y=t,this.parent=void 0}function Edge(e,t,n){this.weight=n,this.node1=e,this.node2=t,this.node1.edges.push(this),this.node2.edges.push(this)}function Node(e){this.key=numNodes++,this.val=e,this.edges=[]}function KeyVal(e,t){this.w=e,this.val=t}function PriorityQueue(){this.queue=[]}function createArray(e,t){array=new Array;for(var n=0;n<t;n++){array.push([]);for(var i=0;i<e;i++)array[n].push("#")}return array}function shuffle(e){for(var t=e.length-1;t>0;t--){var n=Math.floor(Math.random()*(t+1)),i=e[t];e[t]=e[n],e[n]=i}}function print(e){for(var t=0;t<e.length;t++)console.log(e[t].join(""))}function getNeighbours(e,t,n,i){let o=[];for(var r=0;r<n.length;r++){var s=n[r].x+e.x,l=n[r].y+e.y;s>0&&l>0&&s<t[0].length-1&&l<t.length-1&&t[l][s]==i&&o.push(new Point(s,l))}return o}function arrayToGraph(e){let t=[];for(let n=0;n<e.length;n++){t.push([]);for(let i=0;i<e[0].length;i++)t[n].push(new Node(new Point(i,n)))}for(let n=1;n<t.length-1;n++)for(let i=1;i<t[0].length-1;i++)e[n][i]==PATH&&(e[n+1][i]==PATH&&t[n][i].connect(t[n+1][i],1),e[n][i+1]==PATH&&t[n][i].connect(t[n][i+1],1));return[t[1][1],t[t.length-2][t[0].length-2]]}function chooseMazeGen(e,t,n){e=createArray(e[0].length,e.length);let i=document.getElementById("alg-description-title"),o=document.getElementById("alg-description-body");switch(curMazeGenAlgo){case 0:setTimeout(()=>{fillGrid(t,BLOCK_COLOR),i.innerHTML="Kruskal's Algorithm",o.innerHTML="Simple minimum spanning tree algorithm for maze generation",kruskalsUI(e,t,n)},3e3);break;case 1:setTimeout(()=>{i.innerHTML="Prim's Algorithm",o.innerHTML="Simple minimum spanning tree algorithm for maze generation",fillGrid(t,BLOCK_COLOR),primsUI(e,t,n)},3e3);break;case 2:setTimeout(()=>{i.innerHTML="Backtrack Algorithm",o.innerHTML="Simple maze generation algorithm",fillGrid(t,BLOCK_COLOR),backtrackUI(e,t,n)},3e3)}curMazeGenAlgo=(curMazeGenAlgo+1)%3}function chooseMazeSolve(e,t,n){let i
