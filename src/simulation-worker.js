import{simulate}from'./simulation.js';
self.onmessage=({data})=>{try{self.postMessage({result:simulate(data.project,data.options)});}catch(error){self.postMessage({error:error.message});}};
