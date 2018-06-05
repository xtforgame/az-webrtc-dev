import React from 'react';
import { Switch, Redirect } from 'react-router';
import EnhancedRoute from '~/components/routes/EnhancedRoute';
import PrivateRoute from '~/containers/routes/PrivateRoute';

import MainFrame from '~/containers/MainFrame';
import Home from '~/containers/Home';
import SubContent01 from '~/containers/Home/SubContent01';
import SubContent02 from '~/containers/Home/SubContent02';
import SubContent03 from '~/containers/Home/SubContent03';
import SubContent04 from '~/containers/Home/SubContent04';

import UserProfile from '~/containers/UserProfile';

import Idle from '~/containers/Idle';
import Stats from '~/containers/Idle/tabs/Stats';
import Bots from '~/containers/Idle/tabs/Bots';
import Schedules from '~/containers/Idle/tabs/Schedules';

import Memo from '~/containers/Memo';
import Memos from '~/containers/Memo/tabs/Memos';
import MemoSchedules from '~/containers/Memo/tabs/Schedules';

import Test from '~/containers/Test';
import TestContent from '~/containers/Test/TestContent';
import testCase00 from '~/test-cases/test-case-00';
import testCase01 from '~/test-cases/test-case-01';
import testCase02 from '~/test-cases/test-case-02';

import Login from '~/containers/Login';
import Recovery from '~/containers/Recovery';
import WebsocketTest from '~/containers/WebsocketTest';
import WebsocketTestBasic from '~/containers/WebsocketTest/WebsocketTestBasic';

import getListHierarchy from '~/containers/MainFrame/getListHierarchy';

const testCases = [testCase00, testCase01, testCase02];
const getTestCaseRoutes = () => testCases.map((testCase, i) => {
  const ii = ('0'.repeat(3) + i).slice(-3);
  return {
    name: `case${ii}`,
    path: `/test/case${ii}`,
    component: props => (<TestContent testCase={testCase} />),
    navbar: {
      title: `Case ${ii}`,
    },
  };
});

const defaultName = 'default';

const globalRouteConfig = {
  name: 'root',
  component: ({ routeView }) => routeView, // or props => props.routeViews.default
  routeViews: [{
    switch: true,
    name: defaultName,
    routes: [{
      name: 'redirect',
      path: '/',
      component: () => <Redirect to={{ pathname: '/home' }} />,
      exact: true,
    },
    {
      name: 'login',
      path: '/login',
      component: Login,
    },
    {
      name: 'recovery',
      path: '/recovery/:username/:code?',
      component: Recovery,
    },
    {
      name: 'main',
      path: '/',
      routeClass: PrivateRoute,
      component: MainFrame,
      routeViews: [{
        switch: true,
        name: defaultName,
        routes: [{
          name: 'home',
          path: '/home',
          component: Home,
          // navbar: {
          //   title: 'Home',
          //   level: 0,
          //   // level: currentLevel => (currentLevel ? (currentLevel - 1) : 0),
          // },
          navbar: true,
          routeViews: [{
            routes: [{
              name: 'home-index',
              path: '/home',
              component: () => <Redirect to={{ pathname: '/home/sub01' }} />,
              exact: true,
            },
            {
              name: 'sub01',
              path: '/home/sub01',
              component: SubContent01,
              navbar: {
                title: 'Sub 01',
              },
            },
            {
              name: 'sub02',
              path: '/home/sub02',
              component: SubContent02,
              navbar: {
                title: 'Sub 02',
              },
            },
            {
              name: 'sub03',
              path: '/home/sub03',
              component: SubContent03,
              navbar: {
                title: 'Sub 03',
              },
            },
            {
              name: 'sub04',
              path: '/home/sub04',
              component: SubContent04,
              navbar: {
                title: 'Sub 04',
              },
            }],
          }],
        },
        {
          name: 'idle',
          path: '/idle',
          component: Idle,
          navbar: true,
          routeViews: [{
            routes: [{
              name: 'idle-index',
              path: '/idle',
              component: () => <Redirect to={{ pathname: '/idle/stats' }} />,
              exact: true,
            },
            {
              name: 'stats',
              path: '/idle/stats',
              component: Stats,
              navbar: {
                title: 'Stats',
              },
            },
            {
              name: 'bots',
              path: '/idle/bots',
              component: Bots,
              navbar: {
                title: 'Bots',
              },
            },
            {
              name: 'schedules',
              path: '/idle/schedules',
              component: Schedules,
              navbar: {
                title: 'Schedules',
              },
            }],
          }],
        },
        {
          name: 'memo',
          path: '/memo',
          component: Memo,
          navbar: true,
          routeViews: [{
            routes: [{
              name: 'memo-index',
              path: '/memo',
              component: () => <Redirect to={{ pathname: '/memo/memos' }} />,
              exact: true,
            },
            {
              name: 'memos',
              path: '/memo/memos',
              component: Memos,
              navbar: {
                title: 'Stats',
              },
            },
            {
              name: 'schedules',
              path: '/memo/schedules',
              component: MemoSchedules,
              navbar: {
                title: 'Schedules',
              },
            }],
          }],
        },
        {
          name: 'test',
          path: '/test',
          component: Test,
          navbar: true,
          routeViews: [{
            routes: [{
              name: 'test-index',
              path: '/test',
              component: () => <Redirect to={{ pathname: '/test/case001' }} />,
              exact: true,
            },
            ...getTestCaseRoutes(),
            ],
          }],
        },
        {
          name: 'user-profile',
          path: '/user-profile',
          component: UserProfile,
        },
        {
          name: 'websocket-test',
          path: '/websocket-test',
          component: WebsocketTest,
          navbar: true,
          routeViews: [{
            routes: [{
              name: 'websocket-test-index',
              path: '/websocket-test',
              component: () => <Redirect to={{ pathname: '/websocket-test/basic' }} />,
              exact: true,
            },
            {
              name: 'websocket-test-basic',
              path: '/websocket-test/basic',
              component: WebsocketTestBasic,
              navbar: true,
            }],
          }],
        }],
      }],
    }],
  }],
};

getListHierarchy(globalRouteConfig);

function createRouteViews(routeViewsConfigs) {
  const result = {};
  routeViewsConfigs.forEach((v) => {
    const isSwitch = v.switch;
    const name = v.name || defaultName;

    result[name] = v.routes.map(routeConfig => createRoute(routeConfig));

    if (isSwitch) {
      result[name] = (
        <Switch>
          {result[name]}
        </Switch>
      );
    }
  });
  return result;
}

function createRoute(routeConfig) {
  const {
    name,
    routeClass,
    routeViews: routeViewsConfigs,
    ...rest
  } = routeConfig;

  const CustomRoute = routeClass || EnhancedRoute;
  const routeViews = (routeViewsConfigs && createRouteViews(routeViewsConfigs)) || {};
  const routeView = routeViews[defaultName];
  return (
    <CustomRoute
      // do not provide key; this is a bug(?) of react-router v4
      key={name}
      {...rest}
      routeName={name}
      routeView={routeView}
      routeViews={routeViews}
    />
  );
}

export default () => createRoute(globalRouteConfig);
