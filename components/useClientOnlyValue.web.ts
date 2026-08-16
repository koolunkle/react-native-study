import { useEffect, useState } from 'react';

// `useEffect` is not invoked during server rendering, meaning
// we can use this to determine if we're on the server or not.
export function useClientOnlyValue<S, C>(server: S, client: C): S | C {
  const [value, setValue] = useState<S | C>(server);
  useEffect(() => {
    // 의도적 예외: 이 훅의 목적 자체가 "서버 렌더 값 → 클라이언트 값으로 한 번 교체"이므로
    // effect 안에서 setState하는 게 정상 동작이다 (react-hooks/set-state-in-effect 규칙의
    // 일반적인 취지와는 다른, 하이드레이션 불일치 방지 용도의 정당한 예외).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setValue(client);
  }, [client]);

  return value;
}
