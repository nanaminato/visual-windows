import { createFeatureSelector, createSelector } from '@ngrx/store';
import { NodesState } from './state';

export const selectNodesState = createFeatureSelector<NodesState>('nodes');

export const selectAllNodes = createSelector(
    selectNodesState,
    (state) => state.nodes
);

export const selectNodeByKey = (key: string) =>
    createSelector(selectNodesState, (state) => state.nodes[key]);
