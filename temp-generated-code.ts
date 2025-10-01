// AI가 생성한 코드 (검증 테스트용)
interface 사용자프로필 {
  이름: string
  나이: number
}

const 사용자목록: 사용자프로필[] = []

const 사용자추가 = (사용자: 사용자프로필) => {
  사용자목록.push(사용자)
}

export { 사용자추가, 사용자목록 }