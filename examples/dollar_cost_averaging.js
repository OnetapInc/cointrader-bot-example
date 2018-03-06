// ドルコスト平均法による積立を行います。
//
// ドルコスト平均法とは決済通貨建てで同一の金額を一定の間隔で買い続ける積立方法です。
// 購入対象の通貨の平均取得コストが高値になってしまうリスクを減らすことができます。
//
// この取引戦略には下記のパラメータを設定できるようにする必要があります。
//
// - max_investment: 購入金額の上限です。購入金額の合計がこの金額に達するとボットを終了します。
// - buy_amount_by_tick: 一回のボット実行ごとの購入金額です。

const {trade, log, bot, notification} = require('cointrader')

exports.onStart = async (context) => {}

exports.tick = async (context) => {
  const {params} = context

  // 通貨ペア
  const pair = params.currency_pair
  // 購入金額の上限
  const maxInvestment = params.max_investment
  // 一回あたりの購入金額(JPY)
  const buyAmountByTick = params.buy_amount_by_tick
  // ボットの実行回数
  const tickCount = context.bot.tick_count
  // 現在の買い注文の総額
  const totalBuyOrderAmount = context.bot.total_buy_order_amount

  // 購入金額の合計のチェック
  if (maxInvestment < totalBuyOrderAmount) {
    await bot.stop()
    await notification.sendMail('総注文金額の上限に達しました', `総注文金額の上限に達したため、ボット(ID:${context.bot.id})を停止しました。`)
    return
  }

  // 残高のチェック
  const balance = await trade.getBalance()
  if (balance.jpy < buyAmountByTick) {
    await bot.stop()
    notification.sendMail('ボット停止(残高不足)', 'JPY残高の不足が確認されたためボットを停止しました。')
    return
  }

  // 注文金額を現在の相場より高く設定することで擬似的に成り行き注文を行います。
  const ticker = await trade.getTicker(pair)
  const tradingPrice = ticker.bid * 1.2
  const tradingAmount = buyAmountByTick / ticker.bid
  await trade.order({
    pair: pair,
    action: 'buy',
    price: tradingPrice,
    amount: tradingAmount,
  })
}
