import { useEffect, useState } from 'react';
import { subscribeRouteProgress } from '../app/routeProgress';

export function RouteProgress() {
  const [state, setState] = useState({ active: false, width: 0 });

  useEffect(() => subscribeRouteProgress((active, width) => {
    setState({ active, width });
  }), []);

  return (
    <div
      className="route-progress"
      role="progressbar"
      aria-hidden={!state.active}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(state.width)}
      data-active={state.active ? 'true' : 'false'}
      style={{ width: `${state.width}%`, opacity: state.active ? 1 : 0 }}
    />
  );
}
