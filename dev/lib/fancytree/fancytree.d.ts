declare namespace jQuery {
  interface JQuery {
    fancytree(options?: Fancytree.FancytreeOptions): Fancytree.Fancytree;
    fancytree(option: string, ...rest: any[]): any;
  }

  namespace JQueryUI {
    interface UI {
      fancytree: Fancytree.FancytreeStatic;
    }
  }

  namespace Fancytree {
    interface Fancytree {
      $div: JQuery;
      widget: any; // JQueryUI.Widget;
      rootNode: FancytreeNode;
      $container: JQuery;
      focusNode: FancytreeNode;
      options: FancytreeOptions;
      activateKey(key: string | boolean): FancytreeNode;
      applyPatch(patchList: NodePatch[]): JQuery.Promise<any>;
      changeRefKey(oldRefKey: string, newRefKey: string): void;
      clearCookies(): void;
      clearFilter(): void;
      count(): number;
      debug(msg: any): void;
      expandAll(flag?: boolean, options?: object): void;
      filterBranches(filter: string | ((node: FancytreeNode) => boolean)): number;
      filterNodes(
        filter: string | ((node: FancytreeNode) => boolean),
        leavesOnly?: boolean,
      ): number;
      findNextNode(
        match: string | ((node: FancytreeNode) => boolean),
        startNode?: FancytreeNode,
      ): FancytreeNode;
      findAll(match: string | ((node: FancytreeNode) => boolean)): FancytreeNode[];
      generateFormElements(selected?: boolean, active?: boolean): void;
      getActiveNode(): FancytreeNode;
      getFirstChild(): FancytreeNode;
      getFocusNode(ifTreeHasFocus?: boolean): FancytreeNode;
      getNodeByKey(key: string, searchRoot?: FancytreeNode): FancytreeNode;
      getNodesByRef(refKey: string, rootNode?: FancytreeNode): FancytreeNode[];
      getPersistData(): PersistData;
      getRootNode(): FancytreeNode;
      getSelectedNodes(stopOnParents?: boolean): FancytreeNode[];
      hasFocus(): boolean;
      info(msg: any): void;
      isEditing(): FancytreeNode;
      loadKeyPath(
        keyPath: string | string[],
        callback: (node: FancytreeNode, status: string) => void,
      ): JQuery.Promise<any>;
      reactivate(): void;
      reload(source?: any): JQuery.Promise<any>;
      render(force?: boolean, deep?: boolean): void;
      setFocus(flag?: boolean): void;
      toDict(includeRoot?: boolean, callback?: (node: FancytreeNode) => void): any;
      visit(fn: (node: FancytreeNode) => any): boolean;
      warn(msg: any): void;
    }

    interface FancytreeNode {
      tree: Fancytree;
      parent: FancytreeNode;
      key: string;
      title: string;
      data: any;
      children: FancytreeNode[];
      expanded: boolean;
      extraClasses: string;
      folder: boolean;
      icon: string;
      statusNodeType: string;
      lazy: boolean;
      tooltip: string;
      span: HTMLElement;
      tr: HTMLTableRowElement;
      addChildren(
        children: NodeData | NodeData[],
        insertBefore?: FancytreeNode | string | number,
      ): FancytreeNode;
      addClass(className: string): void;
      copyTo(
        targetNode: FancytreeNode,
        mode?: string,
        map?: (node: NodeData) => void,
      ): FancytreeNode;
      countChildren(deep?: boolean): number;
      debug(msg: any): void;
      findAll(match: string | ((node: FancytreeNode) => boolean)): FancytreeNode[];
      findFirst(match: string | ((node: FancytreeNode) => boolean)): FancytreeNode;
      getChildren(): FancytreeNode[];
      getFirstChild(): FancytreeNode;
      getIndex(): number;
      getKeyPath(excludeSelf?: boolean): string;
      getLevel(): number;
      getNextSibling(): FancytreeNode;
      getParent(): FancytreeNode;
      getPrevSibling(): FancytreeNode;
      hasChildren(): boolean;
      hasFocus(): boolean;
      isActive(): boolean;
      isExpanded(): boolean;
      isFolder(): boolean;
      isLazy(): boolean;
      isSelected(): boolean;
      load(forceReload?: boolean): JQuery.Promise<any>;
      remove(): void;
      removeChild(childNode: FancytreeNode): void;
      render(force?: boolean, deep?: boolean): void;
      setActive(flag?: boolean): JQuery.Promise<any>;
      setExpanded(flag?: boolean, opts?: object): JQuery.Promise<any>;
      setFocus(flag?: boolean): void;
      setSelected(flag?: boolean): void;
      sortChildren(cmp?: (a: FancytreeNode, b: FancytreeNode) => number, deep?: boolean): void;
    }

    interface FancytreeOptions {
      autoScroll?: boolean;
      activeVisible?: boolean;
      checkbox?: boolean | string | ((event: JQueryEventObject, data: EventData) => boolean);
      debugLevel?: number;
      extensions?: string[];
      selectMode?: number;
      source?: any;
      activate?: (event: any, data: { node: any }) => void;
    }

    interface PersistData {
      active: string | null;
      expanded: string[];
      focus: string | null;
      selected: string[];
    }
  }
}
