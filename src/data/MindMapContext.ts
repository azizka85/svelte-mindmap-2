export interface RootEntity {
  id?: number;
  children: NodeEntity[];
};

export interface NodeEntity extends RootEntity {
  id: number;
  label: string;
  active: boolean;
  editable: boolean;
  collapsed: boolean;
};

export interface Updater {
  update: () => void;
};

export const MindMapContextKey = 'mindmap';

export class MindMapContext {
  protected canSave: boolean;
  protected root: RootEntity;
  protected activeNode?: NodeEntity;
  protected parents: Map<number, NodeEntity>;

  public mindMapUpdater?: Updater;
  public toolBarUpdater?: Updater;

  protected nodeUpdaters: Map<number, Updater>;
  
  constructor() {
    this.clearState();
  }

  getRoot(): RootEntity {    
    return this.root;
  }

  getActiveNode(): NodeEntity | undefined {
    return this.activeNode;
  }

  protected updateActiveNode(node: NodeEntity | undefined) {
    this.activeNode = node;
  }

  protected updateNode(node: NodeEntity) {
    this.nodeUpdaters.get(node.id)?.update();
  }    

  getInitialNode(): NodeEntity {
    return {
      id: Date.now(),
      label: 'Press Space or double click to edit',
      active: false,
      editable: false,
      collapsed: false,
      children: []      
    };
  }

  getCanSave(): boolean {
    return this.canSave;
  }

  setCanSave(canSave: boolean): void {
    this.canSave = canSave;

    this.toolBarUpdater?.update();
  }
  
  disposeActiveNode(): void {
    this.setActiveNode(undefined);
  }

  parent(node: NodeEntity): NodeEntity | undefined {
    return this.parents.get(node.id);
  }

  protected addNode(parent: NodeEntity | RootEntity, newNode: NodeEntity) {
    parent.children.push(newNode);
  }

  protected addParent(node: NodeEntity, parent: NodeEntity | undefined) {
    if(parent) {
      this.parents.set(node.id, parent);
    }
  }

  protected deleteNode(parent: NodeEntity | RootEntity, node: NodeEntity) {
    const index = parent.children.findIndex(elem => elem.id === node.id);
    
    parent.children.splice(index, 1);  
  }

  protected deleteParent(node: NodeEntity) {
    this.parents.delete(node.id);
  }

  protected clearState(initialNode?: NodeEntity) {
    this.canSave = false;

    this.root = {
      children: []
    };

    if(initialNode) this.root.children.push(initialNode);

    this.activeNode = undefined;

    this.parents = new Map<number, NodeEntity>();
    this.nodeUpdaters = new Map<number, Updater>();
  }

  protected setInitialState() {
    const initialNode = this.getInitialNode();

    this.clearState(initialNode);
  }

  protected initChildren(children: NodeEntity[], parent: NodeEntity | undefined) {
    children.forEach(child => {     
      child.active = false;
      
      this.addParent(child, parent);

      if(child.children.length > 0) {
        this.initChildren(child.children, child);
      }      
    });
  }

  protected updateState(children: NodeEntity[]) {
    this.nodeUpdaters = new Map<number, Updater>();
    this.parents = new Map<number, NodeEntity>();

    this.initChildren(children, undefined);  

    this.root.children = children;
    this.canSave = false;
    this.activeNode = undefined;
  }

  setNodeUpdater(id: number, updater: Updater) {
    this.nodeUpdaters.set(id, updater);
  }

  setNodeLabel(node: NodeEntity, label: string) {
    node.label = label;

    this.updateNode(node);
    this.setCanSave(true);
  }

  setNodeActive(node: NodeEntity, active: boolean) {
    node.active = active;

    this.updateNode(node);
  }

  setNodeEditable(node: NodeEntity, editable: boolean)  {
    node.editable = editable;

    this.updateNode(node);
    this.setCanSave(true);
  }

  setNodeCollapsed(node: NodeEntity, collapsed: boolean) {
    node.collapsed = collapsed;

    this.updateNode(node);
    this.setCanSave(true);
  }

  canMoveToLeftNode(node: NodeEntity): boolean {
    return this.parents.get(node.id) !== undefined;
  }

  canMoveToRightNode(node: NodeEntity): boolean {
    return !node.collapsed && node.children.length > 0;
  }

  canMoveToUpNode(node: NodeEntity): boolean {
    const index = this.parents.get(node.id)?.children?.indexOf(node);

    return index !== undefined && index > 0;
  }

  canMoveToDownNode(node: NodeEntity): boolean {
    const index = this.parents.get(node.id)?.children?.indexOf(node);
    const length = this.parents.get(node.id)?.children?.length || 0;
    
    return index !== undefined && index >= 0 && index < length - 1;
  }

  canActivateLeftNode(): boolean {
    return this.activeNode !== undefined && this.canMoveToLeftNode(this.activeNode);
  }

  canActivateRightNode(): boolean {
    return this.activeNode !== undefined && this.canMoveToRightNode(this.activeNode);
  }

  canActivateUpNode(): boolean {
    return this.activeNode !== undefined && this.canMoveToUpNode(this.activeNode);
  }

  canActivateDownNode(): boolean {
    return this.activeNode !== undefined && this.canMoveToDownNode(this.activeNode);
  }

  middleChildNode(node: NodeEntity): NodeEntity | undefined {
    if(node.children.length > 0) {
      const index = Math.floor((node.children.length - 1) / 2);
      
      return node.children[index];
    }

    return undefined;
  }

  upNode(node: NodeEntity): NodeEntity | undefined {
    const index = this.parents.get(node.id)?.children?.indexOf(node);
    
    if(index !== undefined && index > 0) {
      return this.parents.get(node.id)?.children[index-1];
    }

    return undefined;
  }

  downNode(node: NodeEntity): NodeEntity | undefined {
    const index = this.parents.get(node.id)?.children?.indexOf(node);
    const length = this.parents.get(node.id)?.children?.length || 0;
    
    if(index !== undefined && index >= 0 && index < length - 1) {
      return this.parents.get(node.id)?.children[index + 1];
    }

    return undefined;
  }

  setActiveNode(node: NodeEntity | undefined) {
    if(!node || !this.activeNode || node.id !== this.activeNode.id) {      
      if(this.activeNode) {
        this.activeNode.editable = false;
        this.setNodeActive(this.activeNode, false);              
      }

      if(node) {
        this.setNodeActive(node, true);
      }

      this.updateActiveNode(node);
    }
  }

  createChildNode(parent: NodeEntity | undefined) {
    const newNode: NodeEntity = {
      id: Date.now(),
      label: '',
      active: false,
      editable: true,
      collapsed: false,
      children: []          
    };

    this.addNode(parent || this.root, newNode);    
    this.addParent(newNode, parent);
    this.setActiveNode(newNode);

    if(parent) {      
      this.setNodeCollapsed(parent, false);
    }

    if(!parent) {
      this.mindMapUpdater?.update();
    } else {
      this.updateNode(parent);
    }

    this.setCanSave(true);    
  }

  removeNode(node: NodeEntity) {
    const parent = this.parent(node) || this.getRoot();
    const index = parent.children.indexOf(node);
    const length = parent.children.length;  

    if(!parent.id && length < 2) return;        
    
    this.deleteNode(parent, node);
    this.deleteParent(node);
    
    let focusIndex = parent.children.length - 1;
    
    if(parent.children.length > index) {
      focusIndex = index;
    }

    if(focusIndex >= 0) {
      const focusNode = parent.children[focusIndex];  
      this.setActiveNode(focusNode);        
    } else if(parent.id) {
      this.setActiveNode(parent as NodeEntity);
    }

    if(!parent.id) {
      this.mindMapUpdater?.update();
    } else {
      this.updateNode(parent as NodeEntity);
    }

    this.setCanSave(true);
  }

  setChildNodesCollapsed(node: NodeEntity, collapsed: boolean) {
    this.setNodeCollapsed(node, false);

    node.children.forEach(child => {
      if(!collapsed || child.children.length > 0) {
        this.setNodeCollapsed(child, collapsed);       
      }
    });
  }

  moveToLeftNode(node: NodeEntity) {
    if(this.canMoveToLeftNode(node)) {
      this.setActiveNode(this.parent(node));
    }
  }

  moveToRightNode(node: NodeEntity) {
    if(this.canMoveToRightNode(node)) {
      const childNode = this.middleChildNode(node);

      if(childNode) {
        this.setActiveNode(childNode);
      }
    }
  }

  moveToUpNode(node: NodeEntity) {
    if(this.canMoveToUpNode(node)) {
      const upNode = this.upNode(node);

      if(upNode) {
        this.setActiveNode(upNode);
      }
    }
  }

  moveToDownNode(node: NodeEntity) {
    if(this.canMoveToDownNode(node)) {
      const downNode = this.downNode(node);

      if(downNode) {
        this.setActiveNode(downNode);
      }
    }     
  }

  activateLeftNode() {
    if(this.activeNode && this.canActivateLeftNode()) {
      this.moveToLeftNode(this.activeNode);
    }
  }

  activateRightNode() {
    if(this.activeNode && this.canActivateRightNode()) {
      this.moveToRightNode(this.activeNode);
    }
  }

  activateUpNode() {
    if(this.activeNode && this.canActivateUpNode()) {
      this.moveToUpNode(this.activeNode);
    }
  }

  activateDownNode() {
    if(this.activeNode && this.canActivateDownNode()) {
      this.moveToDownNode(this.activeNode);
    }
  }

  saveToLocalStorage() {
    localStorage.setItem(MindMapContextKey, JSON.stringify(this.root.children));
    
    this.setCanSave(false);
  }

  loadFromLocalStorage() {
    let data = undefined;

    try {
      data = JSON.parse(localStorage.getItem(MindMapContextKey) || '');
    } catch(error) {
      console.error(error);
    }

    if(data && typeof data === 'object') {
      this.updateState(data);
    } else {
      this.setInitialState();
    }

    this.mindMapUpdater?.update();
  }
};
