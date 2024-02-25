# Error Handling

## Handling errors within an `@Select`

```ts
@Component({ ... })
class AppComponent {
  @Select(state => state.count.number.value) count$: Observable<number>;
}
```

Let's take a look at the below example:

```ts
this.store.reset({}); // reset all states
```

The catch is that when resetting the entire state, the object will no longer have those deeply nested properties (`state.count.number.value`). Given the following code:

```ts
const state = {};

function getCount() {
  return state.count.number.value;
}

const count = getCount(); // will throw
```

RxJS will automatically complete the stream under the hood if any error is thrown.

You have to disable suppressing errors using the `suppressErrors` option:

```ts
@NgModule({
  imports: [
    NgxsModule.forRoot([CountState], {
      selectorOptions: {
        suppressErrors: false // `true` by default
      }
    })
  ]
})
export class AppModule {}
```

This option allows to track errors and handle them.

```ts
@Component({ ... })
class AppComponent {
  @Select(state => {
    try {
      return state.count.number.value;
    } catch (error) {
      console.log('error', error);
      // throw error;
      // Automatic unsubscription will occur if you use the `throw` statement here. Skip it if you don't want the stream to be completed on error.
    }
  })
  count$: Observable<number>;
}
```

#### Why does RxJS unsubscribe on error?

RxJS [design guidelines](https://github.com/ReactiveX/rxjs/blob/master/docs\_app/content/guide/observable.md#executing-observables) provides a great explanation of this behavior.
