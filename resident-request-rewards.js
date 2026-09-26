/* 주민 부탁·선물·호감도 설정: 이 파일의 수치만 고치면 됩니다. */
window.dowonResidentRewards = Object.freeze({
  // 각 하트는 바로 전 하트를 완성한 후부터 이 점수만큼 새로 모아야 합니다.
  heartThresholds: [100, 300, 500, 700, 900, 1100, 1300, 1500, 1700, 1900],
  mpcClickPoints: 1,
  npcOrderPoints: 10,
  // 아이템을 새로 추가할 때는 village-request-items.js 목록에만 등록하면 됩니다.
  // MPC 말풍선 부탁도 작물 30~50개, 가공품 2~3개, 음식 1개를 요구합니다.
  requests: Object.freeze(Object.fromEntries(
    Object.entries(window.dowonRequestItems.catalog).map(([key, item]) => [key, Object.freeze({
      name:item.name, quantity:window.dowonRequestItems.qtyRange(key)[0], points:10 + Math.min(30,Math.round(item.price * .5))
    })])
  )),
  requestOfferIntervalMs: 60000,
  requestOfferChance: 0.10,
  requestReplyTimeoutMs: 1*60*1000,
  requestCooldownMs: 2*60*1000,
  // MPC 전용 선물: 5분마다 잠재적으로 1회, 3% 확률. 창고 보유량과 무관하게 1개 지급.
  giftCheckIntervalMs: 5*60*1000,
  giftChance: 0.03,
  giftMinimumHearts: 1
});
