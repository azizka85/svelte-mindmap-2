<script lang="ts">
import { afterUpdate, onMount, setContext } from "svelte";

import { MindMapContext, MindMapContextKey } from "../data/MindMapContext";

import ToolBar from "./ToolBar.svelte";
import Node from './Node.svelte';

let ctx = new MindMapContext();

ctx.mindMapUpdater = {
  update
};

setContext(MindMapContextKey, ctx);

function update() {  
  ctx = ctx;
}

function dispose(evt: MouseEvent) {  
  ctx.disposeActiveNode();
}

onMount(() => {
  ctx.loadFromLocalStorage();
});

afterUpdate(() => {
  console.log('MindMap update');  
});
</script>

<div class="container">
  <ToolBar />
  <ul class="mindmap" on:click={dispose}>
    {#each ctx.getRoot().children as node, index}
      <Node  
        {node}
        tabIndex={index}
      />
    {/each}
  </ul>
</div>
