/// <reference types="@types/jest" />
import { State, NgxsModule, StateToken, Select, Selector, Store } from '@ngxs/store';
import { TestBed } from '@angular/core/testing';
import { Component, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { assertType } from './utils/assert-type';

describe('[TEST]: StateToken', () => {
  it('should successfully create a simple token', () => {
    // Argument of type '"hello"' is not assignable to parameter of type '"You must provide a type parameter"'.
    new StateToken('hello'); // $ExpectError
    new StateToken<string[]>('todos'); // $ExpectType StateToken<string[]>
  });

  it('should successfully provide state token in the "name" property', () => {
    const TODO_LIST_TOKEN = new StateToken<string[]>('todoList');

    @State({
      name: TODO_LIST_TOKEN, // $ExpectType StateToken<string[]>
      defaults: [] // $ExpectType never[]
    })
    @Injectable()
    class TodoListState {}

    @State<string[]>({
      name: TODO_LIST_TOKEN, // $ExpectType StateToken<string[]>
      defaults: [] // $ExpectType never[]
    })
    class TodoListState2 {}

    NgxsModule.forRoot([TodoListState, TodoListState2]);
  });

  it('should type check the "defaults" property', () => {
    interface MyStateModel {
      hello: string;
      world: number;
    }

    const BAR_STATE_TOKEN = new StateToken<MyStateModel>('bar');

    @State({
      name: BAR_STATE_TOKEN, // $ExpectType StateToken<MyStateModel>
      defaults: {} // $ExpectError
    })
    @Injectable()
    class BarState {}

    @State({
      name: BAR_STATE_TOKEN, // $ExpectType StateToken<MyStateModel>
      defaults: { hello: 'world', world: 1 } // $ExpectType { hello: string; world: number; }
    })
    @Injectable()
    class BarState2 {}

    @State<MyStateModel>({
      name: BAR_STATE_TOKEN, // $ExpectType StateToken<MyStateModel>
      defaults: { hello: 'world', world: 1 } // $ExpectType { hello: string; world: number; }
    })
    @Injectable()
    class BarState3 {}

    const FOO_STATE_TOKEN = new StateToken<number[]>('foo');

    @State({
      name: FOO_STATE_TOKEN,
      defaults: true // $ExpectError
    })
    @Injectable()
    class FooState {}

    NgxsModule.forRoot([BarState, BarState2, BarState3, FooState]);
  });

  it('should throw if the provided "defaults" value is invalid', () => {
    const APP_STATE_TOKEN = new StateToken<{ myApp: number[] }>('app');

    @State({
      name: APP_STATE_TOKEN, // $ExpectType StateToken<{ myApp: number[]; }>
      defaults: ['1'] // $ExpectError
    })
    @Injectable()
    class AppState {}

    @State<string[]>({
      name: APP_STATE_TOKEN, // $ExpectType StateToken<{ myApp: number[]; }>
      defaults: ['2'] // $ExpectType string[]
    })
    class AppState2 {}

    const APP3_STATE_TOKEN = new StateToken<unknown>('app3');

    @State({
      name: APP3_STATE_TOKEN, // $ExpectType StateToken<unknown>
      defaults: [] // $ExpectType never[]
    })
    @Injectable()
    class AppState3 {}

    NgxsModule.forRoot([AppState, AppState2, AppState3]);
  });

  it('should infer types in the @Selector decorator', () => {
    const TODO_LIST_TOKEN = new StateToken<string[]>('todos');

    @State({
      name: TODO_LIST_TOKEN,
      defaults: []
    })
    @Injectable()
    class TodoListState {
      @Selector([TODO_LIST_TOKEN]) // $ExpectType (state: string[]) => string[]
      static todosV1(state: string[]): string[] {
        return state;
      }

      @Selector([TODO_LIST_TOKEN]) // $ExpectError
      static todosV2(state: number): number {
        return state;
      }

      @Selector() // (state: string[]) => string[]
      static todosV3(state: string[]): string[] {
        return state;
      }

      @Selector([TodoListState, TODO_LIST_TOKEN]) // $ExpectError
      static todosV4(state: string[], other: number[]): number {
        return state.length + other.length;
      }
    }

    NgxsModule.forRoot([TodoListState]);
  });

  it('should be correct type checking in select', () => {
    interface MyModel {
      bar: boolean;
    }

    const FOO_TOKEN = new StateToken<MyModel>('foo');

    @State({
      name: FOO_TOKEN,
      defaults: { bar: false }
    })
    @Injectable()
    class FooState {
      @Selector([FOO_TOKEN])
      static bar(state: MyModel) {
        return state.bar;
      }
    }

    @Component({ selector: 'app' })
    class AppComponent {
      @Select() appV1$: string; // $ExpectType string
      @Select() appV2$: string; // $ExpectType string
      @Select((state: string) => state) appV3$: string; // $ExpectType string
      @Select((state: string) => state) appV3_1$: Observable<string>; // $ExpectType Observable<string>

      // Argument of type is not assignable to parameter of type Observable<{ foo: boolean }>
      @Select(FOO_TOKEN) appV4$: string; // $ExpectType string
      @Select(FOO_TOKEN) appV5$: Observable<string>; // $ExpectType Observable<string>
      @Select(FOO_TOKEN) appV6$: Observable<MyModel>; // $ExpectType Observable<MyModel>

      @Select(FooState.bar) bar$: string; // $ExpectType string
      @Select(FooState.bar) bar1$: Observable<string>; // $ExpectType Observable<string>
      @Select(FooState.bar) bar2$: Observable<boolean>; // $ExpectType Observable<boolean>

      constructor(public store: Store) {}
    }

    TestBed.configureTestingModule({
      declarations: [AppComponent],
      imports: [NgxsModule.forRoot([FooState])]
    });

    const appComponent: AppComponent = TestBed.createComponent<AppComponent>(AppComponent)
      .componentInstance;

    const snapshotByToken = appComponent.store.selectSnapshot(FOO_TOKEN);

    assertType(() => snapshotByToken); // $ExpectType MyModel

    const selectByToken = appComponent.store.select(FOO_TOKEN);

    assertType(() => selectByToken); // $ExpectType Observable<MyModel>

    const selectOnceByToken = appComponent.store.selectOnce(FOO_TOKEN);

    assertType(() => selectOnceByToken); // $ExpectType Observable<MyModel>
  });
});
