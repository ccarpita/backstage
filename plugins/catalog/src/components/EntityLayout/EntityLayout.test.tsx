/*
 * Copyright 2020 The Backstage Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { CatalogApi } from '@backstage/catalog-client';
import { Entity } from '@backstage/catalog-model';
import {
  catalogApiRef,
  EntityProvider,
  AsyncEntityProvider,
} from '@backstage/plugin-catalog-react';
import { renderInTestApp } from '@backstage/test-utils';
import { fireEvent } from '@testing-library/react';
import React from 'react';
import { act } from 'react-dom/test-utils';
import { Route, Routes } from 'react-router';
import { EntityLayout } from './EntityLayout';

import { AlertApi, alertApiRef } from '@backstage/core-plugin-api';
import { ApiProvider, ApiRegistry } from '@backstage/core-app-api';

const mockEntity = {
  kind: 'MyKind',
  metadata: {
    name: 'my-entity',
  },
} as Entity;

const mockApis = ApiRegistry.with(catalogApiRef, {} as CatalogApi).with(
  alertApiRef,
  {} as AlertApi,
);

describe('EntityLayout', () => {
  it('renders simplest case', async () => {
    const rendered = await renderInTestApp(
      <ApiProvider apis={mockApis}>
        <EntityProvider entity={mockEntity}>
          <EntityLayout>
            <EntityLayout.Route path="/" title="tabbed-test-title">
              <div>tabbed-test-content</div>
            </EntityLayout.Route>
          </EntityLayout>
        </EntityProvider>
      </ApiProvider>,
    );

    expect(rendered.getByText('my-entity')).toBeInTheDocument();
    expect(rendered.getByText('tabbed-test-title')).toBeInTheDocument();
    expect(rendered.getByText('tabbed-test-content')).toBeInTheDocument();
  });

  it('renders the entity title if defined', async () => {
    const mockEntityWithTitle = {
      kind: 'MyKind',
      metadata: {
        name: 'my-entity',
        title: 'My Entity',
      },
    } as Entity;

    const rendered = await renderInTestApp(
      <ApiProvider apis={mockApis}>
        <EntityProvider entity={mockEntityWithTitle}>
          <EntityLayout>
            <EntityLayout.Route path="/" title="tabbed-test-title">
              <div>tabbed-test-content</div>
            </EntityLayout.Route>
          </EntityLayout>
        </EntityProvider>
      </ApiProvider>,
    );

    expect(rendered.getByText('My Entity')).toBeInTheDocument();
    expect(rendered.getByText('tabbed-test-title')).toBeInTheDocument();
    expect(rendered.getByText('tabbed-test-content')).toBeInTheDocument();
  });

  it('renders error message when entity is not found', async () => {
    const rendered = await renderInTestApp(
      <ApiProvider apis={mockApis}>
        <AsyncEntityProvider loading={false}>
          <EntityLayout>
            <EntityLayout.Route path="/" title="tabbed-test-title">
              <div>tabbed-test-content</div>
            </EntityLayout.Route>
          </EntityLayout>
        </AsyncEntityProvider>
      </ApiProvider>,
    );

    expect(rendered.getByText('Warning: Entity not found')).toBeInTheDocument();
    expect(rendered.queryByText('my-entity')).not.toBeInTheDocument();
    expect(rendered.queryByText('tabbed-test-title')).not.toBeInTheDocument();
    expect(rendered.queryByText('tabbed-test-content')).not.toBeInTheDocument();
  });

  it('navigates when user clicks different tab', async () => {
    const rendered = await renderInTestApp(
      <Routes>
        <Route
          path="/*"
          element={
            <ApiProvider apis={mockApis}>
              <EntityProvider entity={mockEntity}>
                <EntityLayout>
                  <EntityLayout.Route path="/" title="tabbed-test-title">
                    <div>tabbed-test-content</div>
                  </EntityLayout.Route>
                  <EntityLayout.Route
                    path="/some-other-path"
                    title="tabbed-test-title-2"
                  >
                    <div>tabbed-test-content-2</div>
                  </EntityLayout.Route>
                </EntityLayout>
              </EntityProvider>
            </ApiProvider>
          }
        />
      </Routes>,
    );

    const secondTab = rendered.queryAllByRole('tab')[1];
    act(() => {
      fireEvent.click(secondTab);
    });

    expect(rendered.getByText('tabbed-test-title')).toBeInTheDocument();
    expect(rendered.queryByText('tabbed-test-content')).not.toBeInTheDocument();

    expect(rendered.getByText('tabbed-test-title-2')).toBeInTheDocument();
    expect(rendered.queryByText('tabbed-test-content-2')).toBeInTheDocument();
  });

  it('should conditionally render tabs', async () => {
    const shouldRenderTab = (e: Entity) => e.metadata.name === 'my-entity';
    const shouldNotRenderTab = (e: Entity) => e.metadata.name === 'some-entity';

    const rendered = await renderInTestApp(
      <ApiProvider apis={mockApis}>
        <EntityProvider entity={mockEntity}>
          <EntityLayout>
            <EntityLayout.Route path="/" title="tabbed-test-title">
              <div>tabbed-test-content</div>
            </EntityLayout.Route>
            <EntityLayout.Route
              path="/some-other-path"
              title="tabbed-test-title-2"
              if={shouldNotRenderTab}
            >
              <div>tabbed-test-content-2</div>
            </EntityLayout.Route>
            <EntityLayout.Route
              path="/some-other-other-path"
              title="tabbed-test-title-3"
              if={shouldRenderTab}
            >
              <div>tabbed-test-content-3</div>
            </EntityLayout.Route>
          </EntityLayout>
        </EntityProvider>
      </ApiProvider>,
    );

    expect(rendered.queryByText('tabbed-test-title')).toBeInTheDocument();
    expect(rendered.queryByText('tabbed-test-title-2')).not.toBeInTheDocument();
    expect(rendered.queryByText('tabbed-test-title-3')).toBeInTheDocument();
  });
});
