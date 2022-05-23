# [Pattern Identification](https://wordlewars.ctnicholas.dev)

This repo shows how to build a multiplayer Wordle clone with [Liveblocks](https://liveblocks.io), [Vue](https://vuejs.org/), and [Vite](https://vitejs.dev/).

![Wordle wars screenshot](https://wordlewars.ctnicholas.dev/screenshot.png)

## [Try it out](https://wordlewars.ctnicholas.dev)


You can only see your opponent's letters after you've got the word of the day. Scores are saved at the end of the war,
and a new Wordle becomes available at UTC±00:00 every day. It features a dark mode and a colourblind mode.

![Wordle wars screenshot](https://wordlewars.ctnicholas.dev/screenshot-visible.png)


## Getting started

### Run examples locally

- Install all dependencies with `npm install`

- Create an account on [liveblocks.io](https://liveblocks.io/dashboard)

- Copy your public key from the [administration](https://liveblocks.io/dashboard/apikeys)

- Create a file named `.env.local` and add your Liveblocks secret as environment variable `VITE_LIVEBLOCKS_PUBLIC_KEY=sk_test_yourkey`

### Run examples on CodeSandbox

- Open this repository on CodeSandbox with this [link](https://codesandbox.io/s/wordle-wars-with-liveblocks-and-vite-0hhdi)

- Create an account on [liveblocks.io](https://liveblocks.io/dashboard)

- Copy your public key from the [administration](https://liveblocks.io/dashboard/apikeys)

- Create [secret](https://codesandbox.io/docs/secrets) named `VITE_LIVEBLOCKS_PUBLIC_KEY` with the secret key you just copied. You need to create an account on CodeSandbox to add an environment variable.

- Refresh your browser and you should be good to go!

