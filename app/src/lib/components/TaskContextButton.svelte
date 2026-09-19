<script lang="ts">
  let {
    contextKey,
    contextType = 'OBJECT',
    objectType,
    objectId,
    objectVersion = null,
    title,
    subtitle = null,
    routePath,
    workspaceFunctionId = null,
    label = 'Open in Task Bar'
  }: {
    contextKey: string;
    contextType?: string;
    objectType: string;
    objectId: string;
    objectVersion?: string | number | null;
    title: string;
    subtitle?: string | null;
    routePath: string;
    workspaceFunctionId?: string | null;
    label?: string;
  } = $props();

  function open() {
    window.dispatchEvent(
      new CustomEvent('nublox:open-context', {
        detail: {
          contextKey,
          contextType,
          objectType,
          objectId,
          objectVersion: objectVersion == null ? null : String(objectVersion),
          title,
          subtitle,
          routePath,
          workspaceFunctionId
        }
      })
    );
  }
</script>

<button type="button" class="task-pin" onclick={open}>{label}</button>

<style>
  .task-pin {
    border: 1px solid #bdd2df;
    border-radius: 6px;
    padding: 6px 8px;
    background: #f8fbfd;
    color: #37627b;
    font-size: 8.5px;
    font-weight: 800;
    cursor: pointer;
  }
  .task-pin:hover {
    border-color: #79b8d9;
    background: #edf8fe;
  }
</style>
