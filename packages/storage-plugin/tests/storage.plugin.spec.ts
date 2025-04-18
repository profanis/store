import { TestBed } from '@angular/core/testing';
import { Injectable } from '@angular/core';

import { skipConsoleLogging } from '@ngxs/store/internals/testing';
import {
  NgxsModule,
  State,
  Store,
  Action,
  StateContext,
  DispatchOutsideZoneNgxsExecutionStrategy
} from '@ngxs/store';
import { ɵDEFAULT_STATE_KEY } from '@ngxs/storage-plugin/internals';

import {
  NgxsStoragePluginModule,
  StorageOption,
  StorageEngine,
  STORAGE_ENGINE,
  NgxsStoragePluginOptions
} from '../';

describe('NgxsStoragePlugin', () => {
  class Increment {
    static type = 'INCREMENT';
  }

  class Decrement {
    static type = 'DECREMENT';
  }

  interface CounterStateModel {
    count: number;
  }

  @State<CounterStateModel>({
    name: 'counter',
    defaults: { count: 0 }
  })
  @Injectable()
  class CounterState {
    @Action(Increment)
    increment({ getState, setState }: StateContext<CounterStateModel>) {
      setState({
        count: getState().count + 1
      });
    }

    @Action(Decrement)
    decrement({ getState, setState }: StateContext<CounterStateModel>) {
      setState({
        count: getState().count - 1
      });
    }
  }

  @State<CounterStateModel>({
    name: 'lazyLoaded',
    defaults: { count: 0 }
  })
  @Injectable()
  class LazyLoadedState {}

  afterEach(() => {
    localStorage.removeItem(ɵDEFAULT_STATE_KEY);
    sessionStorage.removeItem(ɵDEFAULT_STATE_KEY);
  });

  class CounterInfoStateModel {
    constructor(public count: number) {}
  }

  @State<CounterInfoStateModel>({
    name: 'counterInfo',
    defaults: { count: 0 }
  })
  @Injectable()
  class CounterInfoState {}

  it('should get initial data from localstorage', () => {
    // Arrange
    localStorage.setItem(ɵDEFAULT_STATE_KEY, JSON.stringify({ counter: { count: 100 } }));

    // Act
    TestBed.configureTestingModule({
      imports: [
        NgxsModule.forRoot([CounterState], {
          executionStrategy: DispatchOutsideZoneNgxsExecutionStrategy
        }),
        NgxsStoragePluginModule.forRoot({ keys: '*' })
      ]
    });

    const store: Store = TestBed.inject(Store);
    const state: CounterStateModel = store.selectSnapshot(CounterState);

    // Assert
    expect(state.count).toBe(100);
  });

  it('should save data to localstorage', () => {
    // Arrange
    localStorage.setItem(ɵDEFAULT_STATE_KEY, JSON.stringify({ counter: { count: 100 } }));

    // Act
    TestBed.configureTestingModule({
      imports: [
        NgxsModule.forRoot([CounterState], {
          executionStrategy: DispatchOutsideZoneNgxsExecutionStrategy
        }),
        NgxsStoragePluginModule.forRoot({ keys: '*' })
      ]
    });

    const store: Store = TestBed.inject(Store);

    store.dispatch(new Increment());
    store.dispatch(new Increment());
    store.dispatch(new Increment());
    store.dispatch(new Increment());
    store.dispatch(new Increment());

    const state: CounterStateModel = store.selectSnapshot(CounterState);

    // Assert
    expect(state.count).toBe(105);
    expect(localStorage.getItem(ɵDEFAULT_STATE_KEY)).toBe(
      JSON.stringify({ counter: { count: 105 } })
    );
  });

  describe('when blank values are returned from localstorage', () => {
    it('should use default data if null retrieved from localstorage', () => {
      // Arrange
      localStorage.setItem(ɵDEFAULT_STATE_KEY, <any>null);

      @State<CounterStateModel>({
        name: 'counter',
        defaults: {
          count: 123
        }
      })
      @Injectable()
      class TestState {}

      // Act
      TestBed.configureTestingModule({
        imports: [
          NgxsModule.forRoot([TestState], {
            executionStrategy: DispatchOutsideZoneNgxsExecutionStrategy
          }),
          NgxsStoragePluginModule.forRoot({ keys: '*' })
        ]
      });

      const store: Store = skipConsoleLogging(() => TestBed.inject(Store));
      const state: CounterStateModel = store.selectSnapshot(TestState);

      // Assert
      expect(state.count).toBe(123);
    });

    it('should use default data if undefined retrieved from localstorage', () => {
      // Arrange
      localStorage.setItem(ɵDEFAULT_STATE_KEY, <any>undefined);

      @State<CounterStateModel>({
        name: 'counter',
        defaults: {
          count: 123
        }
      })
      @Injectable()
      class TestState {}

      // Act
      TestBed.configureTestingModule({
        imports: [
          NgxsModule.forRoot([TestState], {
            executionStrategy: DispatchOutsideZoneNgxsExecutionStrategy
          }),
          NgxsStoragePluginModule.forRoot({ keys: '*' })
        ]
      });

      const store: Store = skipConsoleLogging(() => TestBed.inject(Store));
      const state: CounterStateModel = store.selectSnapshot(TestState);

      // Assert
      expect(state.count).toBe(123);
    });

    it(`should use default data if the string 'undefined' retrieved from localstorage`, () => {
      // Arrange
      localStorage.setItem(ɵDEFAULT_STATE_KEY, 'undefined');

      @State<CounterStateModel>({
        name: 'counter',
        defaults: {
          count: 123
        }
      })
      @Injectable()
      class TestState {}

      // Act
      TestBed.configureTestingModule({
        imports: [
          NgxsModule.forRoot([TestState], {
            executionStrategy: DispatchOutsideZoneNgxsExecutionStrategy
          }),
          NgxsStoragePluginModule.forRoot({ keys: '*' })
        ]
      });

      const store: Store = TestBed.inject(Store);
      const state: CounterStateModel = store.selectSnapshot(TestState);

      // Assert
      expect(state.count).toBe(123);
    });
  });

  it('should migrate global localstorage', () => {
    // Arrange
    const data = JSON.stringify({ counter: { count: 100, version: 1 } });
    localStorage.setItem(ɵDEFAULT_STATE_KEY, data);

    // Act
    TestBed.configureTestingModule({
      imports: [
        NgxsModule.forRoot([CounterState], {
          executionStrategy: DispatchOutsideZoneNgxsExecutionStrategy
        }),
        NgxsStoragePluginModule.forRoot({
          keys: '*',
          migrations: [
            {
              version: 1,
              versionKey: 'counter.version',
              migrate: (state: any) => {
                state.counter = {
                  counts: state.counter.count,
                  version: 2
                };
                return state;
              }
            }
          ]
        })
      ]
    });

    const store: Store = TestBed.inject(Store);
    // Call `selectSnapshot` so the `NgxsStoragePlugin.handle` will be invoked also
    // and will run migations
    store.selectSnapshot(CounterState);

    // Assert
    expect(localStorage.getItem(ɵDEFAULT_STATE_KEY)).toBe(
      JSON.stringify({ counter: { counts: 100, version: 2 } })
    );
  });

  it('should migrate single localstorage', () => {
    // Arrange
    const data = JSON.stringify({ count: 100, version: 1 });
    localStorage.setItem('counter', data);

    // Act
    TestBed.configureTestingModule({
      imports: [
        NgxsModule.forRoot([CounterState], {
          executionStrategy: DispatchOutsideZoneNgxsExecutionStrategy
        }),
        NgxsStoragePluginModule.forRoot({
          keys: ['counter'],
          migrations: [
            {
              version: 1,
              key: 'counter',
              versionKey: 'version',
              migrate: (state: any) => {
                state = {
                  counts: state.count,
                  version: 2
                };
                return state;
              }
            }
          ]
        })
      ]
    });

    const store: Store = TestBed.inject(Store);
    // Call `selectSnapshot` so the `NgxsStoragePlugin.handle` will be invoked also
    // and will run migations
    store.selectSnapshot(CounterState);

    // Assert
    expect(localStorage.getItem('counter')).toBe(JSON.stringify({ counts: 100, version: 2 }));
  });

  it('should correct get data from session storage', () => {
    // Arrange
    sessionStorage.setItem(ɵDEFAULT_STATE_KEY, JSON.stringify({ counter: { count: 100 } }));

    // Act
    TestBed.configureTestingModule({
      imports: [
        NgxsModule.forRoot([CounterState], {
          executionStrategy: DispatchOutsideZoneNgxsExecutionStrategy
        }),
        NgxsStoragePluginModule.forRoot({
          keys: '*',
          storage: StorageOption.SessionStorage
        })
      ]
    });

    const store: Store = TestBed.inject(Store);
    const state: CounterStateModel = store.selectSnapshot(CounterState);

    // Assert
    expect(state.count).toBe(100);
  });

  it('should save data to sessionStorage', () => {
    sessionStorage.setItem(ɵDEFAULT_STATE_KEY, JSON.stringify({ counter: { count: 100 } }));

    TestBed.configureTestingModule({
      imports: [
        NgxsModule.forRoot([CounterState], {
          executionStrategy: DispatchOutsideZoneNgxsExecutionStrategy
        }),
        NgxsStoragePluginModule.forRoot({
          keys: '*',
          storage: StorageOption.SessionStorage
        })
      ]
    });

    const store: Store = TestBed.inject(Store);

    store.dispatch(new Increment());
    store.dispatch(new Increment());
    store.dispatch(new Increment());
    store.dispatch(new Increment());
    store.dispatch(new Increment());

    const state: CounterStateModel = store.selectSnapshot(CounterState);

    // Assert
    expect(state.count).toBe(105);
    expect(sessionStorage.getItem(ɵDEFAULT_STATE_KEY)).toBe(
      JSON.stringify({ counter: { count: 105 } })
    );
  });

  it('should use a custom storage engine', () => {
    // Arrange
    class CustomStorage implements StorageEngine {
      static Storage: any = {
        [ɵDEFAULT_STATE_KEY]: {
          counter: {
            count: 100
          }
        }
      };

      get length() {
        return Object.keys(CustomStorage.Storage).length;
      }

      getItem(key: string) {
        return CustomStorage.Storage[key];
      }

      setItem(key: string, val: any) {
        CustomStorage.Storage[key] = val;
      }

      removeItem(key: string) {
        delete CustomStorage.Storage[key];
      }

      clear() {
        CustomStorage.Storage = {};
      }
    }

    // Act
    TestBed.configureTestingModule({
      imports: [
        NgxsModule.forRoot([CounterState], {
          executionStrategy: DispatchOutsideZoneNgxsExecutionStrategy
        }),
        NgxsStoragePluginModule.forRoot({
          keys: '*',
          serialize(val) {
            return val;
          },
          deserialize(val) {
            return val;
          }
        })
      ],
      providers: [
        {
          provide: STORAGE_ENGINE,
          useClass: CustomStorage
        }
      ]
    });

    const store: Store = TestBed.inject(Store);

    store.dispatch(new Increment());
    store.dispatch(new Increment());
    store.dispatch(new Increment());
    store.dispatch(new Increment());
    store.dispatch(new Increment());

    const state: CounterStateModel = store.selectSnapshot(CounterState);

    // Assert
    expect(state.count).toBe(105);
    expect(CustomStorage.Storage[ɵDEFAULT_STATE_KEY]).toEqual({ counter: { count: 105 } });
  });

  it('should merge unloaded data from feature with local storage', () => {
    // Arrange
    localStorage.setItem(ɵDEFAULT_STATE_KEY, JSON.stringify({ counter: { count: 100 } }));

    // Act
    TestBed.configureTestingModule({
      imports: [
        NgxsModule.forRoot([CounterState], {
          executionStrategy: DispatchOutsideZoneNgxsExecutionStrategy
        }),
        NgxsStoragePluginModule.forRoot({ keys: '*' }),
        NgxsModule.forFeature([LazyLoadedState])
      ]
    });

    const store: Store = TestBed.inject(Store);
    const state: {
      counter: CounterStateModel;
      lazyLoaded: CounterStateModel;
    } = store.snapshot();

    // Assert
    expect(state.lazyLoaded).toBeDefined();
  });

  describe('State classes as key', () => {
    @State({
      name: 'names',
      defaults: []
    })
    @Injectable()
    class NamesState {}

    it('should be possible to provide a state class as a key', () => {
      // Arrange
      localStorage.setItem('counter', JSON.stringify({ count: 100 }));

      // Act
      TestBed.configureTestingModule({
        imports: [
          NgxsModule.forRoot([CounterState], {
            executionStrategy: DispatchOutsideZoneNgxsExecutionStrategy
          }),
          NgxsStoragePluginModule.forRoot({
            keys: [CounterState]
          })
        ]
      });

      const store: Store = TestBed.inject(Store);
      const state: CounterStateModel = store.selectSnapshot(CounterState);

      // Assert
      expect(state.count).toBe(100);
    });

    it('should be possible to provide array of state classes', () => {
      // Arrange
      localStorage.setItem('counter', JSON.stringify({ count: 100 }));
      localStorage.setItem('names', JSON.stringify(['Mark', 'Artur', 'Max']));

      // Act
      TestBed.configureTestingModule({
        imports: [
          NgxsModule.forRoot([CounterState, NamesState], {
            executionStrategy: DispatchOutsideZoneNgxsExecutionStrategy
          }),
          NgxsStoragePluginModule.forRoot({
            keys: [CounterState, NamesState]
          })
        ]
      });

      const store: Store = TestBed.inject(Store);

      // Assert
      expect(store.snapshot()).toEqual({
        counter: {
          count: 100
        },
        names: ['Mark', 'Artur', 'Max']
      });
    });

    it('should be possible to use both state classes and strings', () => {
      // Arrange
      localStorage.setItem('counter', JSON.stringify({ count: 100 }));
      localStorage.setItem('names', JSON.stringify(['Mark', 'Artur', 'Max']));

      // Act
      TestBed.configureTestingModule({
        imports: [
          NgxsModule.forRoot([CounterState, NamesState], {
            executionStrategy: DispatchOutsideZoneNgxsExecutionStrategy
          }),
          NgxsStoragePluginModule.forRoot({
            keys: [CounterState, 'names']
          })
        ]
      });

      const store: Store = TestBed.inject(Store);

      // Assert
      expect(store.snapshot()).toEqual({
        counter: {
          count: 100
        },
        names: ['Mark', 'Artur', 'Max']
      });
    });
  });

  describe('Custom serialization', () => {
    it('should alter object before serialization.', () => {
      // Arrange
      localStorage.setItem(ɵDEFAULT_STATE_KEY, JSON.stringify({ counter: { count: 100 } }));

      // Act
      TestBed.configureTestingModule({
        imports: [
          NgxsModule.forRoot([CounterState], {
            executionStrategy: DispatchOutsideZoneNgxsExecutionStrategy
          }),
          NgxsStoragePluginModule.forRoot({
            keys: '*',
            beforeSerialize: obj => {
              return {
                counter: {
                  count: obj.counter.count * 2
                }
              };
            }
          })
        ]
      });

      const store: Store = TestBed.inject(Store);

      store.dispatch(new Increment());

      const state: CounterStateModel = store.selectSnapshot(CounterState);

      // Assert
      expect(state.count).toBe(101);
      expect(localStorage.getItem(ɵDEFAULT_STATE_KEY)).toBe(
        JSON.stringify({ counter: { count: 202 } })
      );
    });

    it('should alter state and return concrete type after deserialization.', () => {
      // Arrange
      localStorage.setItem('counterInfo', JSON.stringify({ count: 100 }));

      // Act
      TestBed.configureTestingModule({
        imports: [
          NgxsModule.forRoot([CounterInfoState], {
            executionStrategy: DispatchOutsideZoneNgxsExecutionStrategy
          }),
          NgxsStoragePluginModule.forRoot({
            keys: ['counterInfo'],
            afterDeserialize: (obj, key) => {
              if (key === 'counterInfo') {
                return new CounterInfoStateModel(obj.count);
              }
              return obj;
            }
          })
        ]
      });

      const store: Store = TestBed.inject(Store);
      const state: CounterInfoStateModel = store.selectSnapshot(CounterInfoState);

      // Assert
      expect(state).toBeInstanceOf(CounterInfoStateModel);
      expect(state.count).toBe(100);
    });

    describe('namespace option', () => {
      @State({
        name: 'names',
        defaults: []
      })
      @Injectable()
      class NamesState {}

      const testSetup = (options?: NgxsStoragePluginOptions) => {
        TestBed.configureTestingModule({
          imports: [
            NgxsModule.forRoot([CounterState, NamesState], {
              developmentMode: true,
              executionStrategy: DispatchOutsideZoneNgxsExecutionStrategy
            }),
            NgxsStoragePluginModule.forRoot(options as any)
          ]
        });

        return { store: TestBed.inject(Store) };
      };

      it('should prefix namespace the default state key (key option is not provided)', () => {
        // Arrange & act
        const namespace = 'navbar_app';
        localStorage.setItem(
          // `navbar_app:@@STATE`.
          `${namespace}:${ɵDEFAULT_STATE_KEY}`,
          JSON.stringify({ counter: { count: 100 } })
        );
        const { store } = testSetup({ keys: '*', namespace });
        const state: CounterStateModel = store.selectSnapshot(CounterState);
        // Assert
        expect(state.count).toBe(100);
      });

      it('should prefix namespace the state slice (key option is provided)', () => {
        // Arrange & act
        const namespace = 'my_cool_app';
        localStorage.setItem(
          // `navbar_app:names`.
          `${namespace}:names`,
          JSON.stringify(['Mark', 'Artur', 'Max'])
        );
        const { store } = testSetup({ namespace, keys: [NamesState] });
        const names = store.selectSnapshot<string[]>(NamesState);
        const { count } = store.selectSnapshot<CounterStateModel>(CounterState);
        // Assert
        expect(names).toEqual(['Mark', 'Artur', 'Max']);
        expect(count).toEqual(0);
      });

      it('should log the namespaced key into the console when it failed to deserialize the value', () => {
        // Arrange & act
        const namespace = 'my_cool_app';
        localStorage.setItem(
          // `navbar_app:names`.
          `${namespace}:names`,
          // Just a random invalid value.
          `undefined+null+something_else`
        );
        const spy = jest.spyOn(console, 'error').mockImplementation();
        testSetup({ namespace, keys: [NamesState] });
        // Assert
        try {
          expect(spy).toHaveBeenCalledWith(
            expect.stringMatching(
              /Error ocurred while deserializing the my_cool_app:names store value/
            ),
            expect.anything()
          );
        } finally {
          spy.mockRestore();
        }
      });
    });
  });
});
