import { createReducer, on } from '@ngrx/store';
import { NodesActions } from './nodes.actions';
import { NodesState, initialNodesState } from './state';

export const nodesReducer = createReducer(
    initialNodesState,

    on(NodesActions.setNodeValue, (state, { key, value }) => ({
        ...state,
        nodes: { ...state.nodes, [key]: value }
    })),

    on(NodesActions.updateNodeValue, (state, { key, value }) => ({
        ...state,
        nodes: {
            ...state.nodes,
            [key]: {
                ...(state.nodes[key] || {}),
                ...value
            }
        }
    })),

    on(NodesActions.removeNodeValue, (state, { key }) => {
        const newNodes = { ...state.nodes };
        delete newNodes[key];
        return {
            ...state,
            nodes: newNodes
        };
    }),

    on(NodesActions.clearAllNodes, (state) => ({
        ...state,
        nodes: {}
    }))
);
