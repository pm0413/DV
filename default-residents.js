/* 새 게임 최초 실행 전용 주민 기본 설정.
 * 1·2번 슬롯의 초기 데이터이며, 저장된 주민 정보는 덮어쓰지 않습니다.
 * 캐릭터 이미지 파일은 character/ 폴더에 각각 넣어 주세요.
 * 대사는 | 로 구분하며, 밭 원격 답변은 해당 주민의 반응 칸에 기록됩니다.
 */
window.DOWON_DEFAULT_RESIDENTS = [
  {
    name: '당보', image: 'character/당보.gif', gender: '남성', age: 76, month: 5, day: 17,
    favoritePlaceName: '지붕 1',
    morningLines: '(비몽사몽)|좋은 아침입니다!',
    generalLines: '날이 좋소!|형님 보고싶다',
    generalNightLines: '하늘에 달이 예쁘게 떴소 형님.',
    rainLines: '이것도 제법 운치있구려',
    rainNightLines: '달이 안보이는건 좀 아쉬운거 같기도...',
    clickLines: '음?|뭐요?',
    repeatClickLines: '그만찌르쇼|고만 찌르쇼!',
    tenClickLines: '아 형님!!!!!',
    farmOpening: '(뭔가를 느낀다)|호다닥',
    farmArrival: '밭에 뭐 하셨습니까?|밭 건드셨수?',
    farmReplyToOther: '아 건들지 마쇼 좀!|아 형님 자라기 전까지 냅두랬잖소~!',
    relationships: {'1': '친구'}
  },
  {
    name: '청명', image: 'character/청명.gif', gender: '남성', age: 82, month: 10, day: 10,
    favoritePlaceName: '계단',
    morningLines: '으럇!! (벌떡 기상한다)|좋은 아침!',
    generalLines: '당보 고놈 데리고 화음에나 내려갈까..|술땡긴다',
    generalNightLines: '당보야!|(명상중)',
    rainLines: '아침부터 비야...|오늘 훈련은 땡쳐야지',
    rainNightLines: '거 운치있네|당보 요놈 어디있나',
    clickLines: '뭐야?|뭐냐?',
    repeatClickLines: '찌르지마라|죽고싶냐?',
    tenClickLines: '(서걱)|(푹!)',
    farmOpening: '어라?|오호?',
    farmArrival: '당보야 이거 건드려도 되냐!|이거 뭐지(콕콕)',
    farmReplyToOther: '나 안건들였어!|몰라?',
    relationships: {'0': '친구'}
  }
];
