# LoopLocal

**A neighbourhood where nothing is wasted.** LoopLocal is the brain that makes a neighbourhood's water, power, waste and drains help each other. The Loop Hub is the body where its decisions happen. Worked example: Kukatpally / KPHB, Hyderabad. Supports SDGs 6, 7, 9 and 11.

## What is in the app

| Route | What it shows |
| --- | --- |
| `/` | Overview: the problem, the five loops, the Core, the Loop Hub |
| `/command` | Officer, Resident and Field Worker views (switch role in the top bar) |
| `/loops` | Live flow diagram of the five loops with a node inspector |
| `/hub-twin` | Cross-section of one hub through a day, with and without LoopLocal |
| `/storm` | Run Storm Day: forecast, flagged drains, dispatch, tanks, pits, outage |
| `/impact` | Water, energy and waste outcomes, Loop Score breakdown, SDG badges, assumptions |
| `/replicate` | Loop fingerprints and starting playbooks for five localities |
| `/evidence` | Public figures with sources and verification tags |
| `/hardware` | Architecture, sensor catalogue, 3D hub wiring, MQTT data flow, checklists, rollout, hub sizer, tutorials and a rule-based guide |
| `/security` | Layered security controls, threat table, access matrix, live audit trail |
| `/innovation` | What is new, how it differs from city platforms, SDG mapping |

The prototype runs entirely in the browser on a transparent simulation (`src/lib/sim`). Every formula is listed in the Assumptions drawer. Dispatching an action in the Officer view creates a task in the Field Worker view and a notice in the Resident view through one shared store (`src/store/app.ts`); completing a task raises the Loop Score.

*The software recommends; people carry out the actions.*

## Stack

TanStack Start, React 19, Tailwind CSS v4, shadcn/ui, Framer Motion, Recharts, Leaflet, three.js with react-three-fiber, Zustand.

## Develop

```sh
npm i
npm run dev
```

## Lovable

This project was built with [Lovable](https://lovable.dev) and stays in sync with it: [open it in the editor](https://lovable.dev/projects/691ed909-4da4-4cad-8e34-8ef862599bd3). Pushes to `main` on GitHub sync back into Lovable.
