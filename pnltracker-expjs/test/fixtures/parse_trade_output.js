function mkTrade(dtStr, q, sym, px, fees) {
  return  { date: new Date(dtStr)
          , qty: Number(q)
          , symbol: sym
          , avgPx: Number(px)
          , exchange: '-'
          , fees: Number(fees)
  } ;
}

exports.sampleTradeSet = 
  [ mkTrade('2012-11-19, 08:21:06', 10, 'ib:AAPL', 400.0100, -1.02 )
  , mkTrade('2012-11-19, 09:37:33', -10, 'ib:AAPL', 403.0100, -1.02 )
  , mkTrade('2012-11-03, 08:21:06', 30, 'ib:AAPL', 404.0100, -1.02 )
  , mkTrade('2012-11-03, 09:37:33', -10, 'ib:AAPL', 403.0100, -1.02 )
  , mkTrade('2012-11-03, 09:47:33', -20, 'ib:AAPL', 401.0100, -1.02 )

  , mkTrade('2012-11-03, 08:21:06', 110, 'ib:MSFT', 234.0100, -1.02 )
  , mkTrade('2012-11-02, 09:37:33', -110, 'ib:MSFT', 233.0100, -1.02 )


  , mkTrade('2012-11-03, 08:21:06', 50, 'ib:MSFT', 234.0100, -1.02 )
  , mkTrade('2012-11-03, 09:37:33', -10, 'ib:MSFT', 233.0100, -1.02 )
  , mkTrade('2012-11-03, 09:47:33', -20, 'ib:MSFT', 231.0100, -1.02 )


  , mkTrade('2012-11-03, 08:21:06', 50, 'ib:MSFT', 234.0100, -1.02 )
  , mkTrade('2012-11-03, 09:37:33', -50, 'ib:MSFT', 236.0100, -1.02 )

  , mkTrade('2012-11-03, 08:21:06', 50, 'ib:MSFT', 234.0100, -1.02 )
  , mkTrade('2012-11-05, 09:37:33', -50, 'ib:MSFT', 236.0100, -1.02 )

  , mkTrade('2012-11-03, 08:21:06', 50, 'ib:MSFT', 234.0100, -1.02 )
  , mkTrade('2012-11-03, 09:37:33', -10, 'ib:MSFT', 233.0100, -1.02 )
  , mkTrade('2012-11-03, 09:47:33', -20, 'ib:MSFT', 231.0100, -1.02 )


  , mkTrade('2012-11-03, 08:21:06', 50, 'ib:MSFT', 234.0100, -1.02 )
  , mkTrade('2012-11-03, 09:37:33', -10, 'ib:MSFT', 233.0100, -1.02 )
  , mkTrade('2012-11-03, 09:47:33', -20, 'ib:MSFT', 231.0100, -1.02 )


  , mkTrade('2012-11-03, 08:21:06', 30, 'ib:JNK', 34.0100, -1.02 )
  , mkTrade('2012-11-03, 09:37:33', -10, 'ib:JNK', 33.0100, -1.02 )
  , mkTrade('2012-11-03, 09:47:33', -20, 'ib:JNK', 31.0100, -1.02 )

  , mkTrade('2012-11-17, 08:21:06', 30, 'ib:JNK', 32.0100, -1.02 )
  , mkTrade('2012-11-03, 09:37:33', -10, 'ib:JNK', 33.0100, -1.02 )
  , mkTrade('2012-11-01, 09:47:33', -20, 'ib:JNK', 31.0100, -1.02 )

  , mkTrade('2012-11-07, 08:21:06', 30, 'ib:JNK', 34.0100, -1.02 )
  , mkTrade('2012-11-07, 09:37:33', -10, 'ib:JNK', 33.0100, -1.02 )
  , mkTrade('2012-11-07, 09:47:33', -20, 'ib:JNK', 31.0100, -1.02 )

  , mkTrade('2012-10-14, 08:21:06', 30, 'ib:JNK', 34.0100, -1.02 )
  , mkTrade('2012-10-14, 09:37:33', -30, 'ib:JNK', 38.0100, -1.02 )

  , mkTrade('2012-10-18, 08:21:06', 30, 'ib:JNK', 34.0100, -1.02 )
  , mkTrade('2012-10-19, 09:37:33', -30, 'ib:JNK', 50.0100, -1.02 )

  , mkTrade('2012-10-11, 09:37:33', -100, 'ib:SPY', 133, 0 )
  , mkTrade('2012-10-11, 09:47:33',  100, 'ib:SPY', 131, 0 )
  , mkTrade('2012-10-13, 09:37:33', -100, 'ib:SPY', 135, 0 )
  , mkTrade('2012-10-13, 09:47:33',  100, 'ib:SPY', 131, 0 )
  , mkTrade('2012-10-15, 09:37:33', -100, 'ib:SPY', 138, 0 )
  , mkTrade('2012-10-15, 19:47:33',  100, 'ib:SPY', 131, 0 )
  , mkTrade('2012-10-21, 09:37:33',  100, 'ib:SPY', 133, 0 )
  , mkTrade('2012-10-21, 09:47:33', -100, 'ib:SPY', 131, 0 )

  , mkTrade('2012-10-22, 09:37:33',  100, 'ib:SPY', 100, 0 )
  , mkTrade('2012-10-22, 09:47:33', -100, 'ib:SPY', 101, 0 )

  , mkTrade('2012-10-23, 09:37:33',  100, 'ib:SPY', 100, 0 )
  , mkTrade('2012-10-23, 09:47:33', -100, 'ib:SPY', 101, 0 )

  , mkTrade('2012-10-24, 09:37:33',  100, 'ib:SPY', 100, 0 )
  , mkTrade('2012-10-24, 09:47:33', -100, 'ib:SPY', 101, 0 )

  , mkTrade('2012-10-25, 09:37:33',  100, 'ib:SPY', 100, 0 )
  , mkTrade('2012-10-25, 09:47:33', -100, 'ib:SPY', 101, 0 )

  ] ; 

exports.ibEmailedSampleTrades = 
[ { date: new Date('2012-09-05, 12:18:18'),
  qty: 5,
  symbol: 'ib:ZNGA 22DEC12 2.0 P',
  exchange: '-',
  avgPx: 0.1100,
  fees: -2.20,
  acctId: 'U764128' } ]

exports.ibGeneratedSampleTrades = 
  [ { date: new Date('2011-10-19, 08:21:06'),
    qty: 100,
    symbol: 'ib:AAPL',
    exchange: '-',
    avgPx: 400.0100,
    fees: -1.02 },
  { date: new Date('2011-10-19, 09:37:33'),
    qty: -100,
    symbol: 'ib:AAPL',
    exchange: '-',
    avgPx: 403.0600,
    fees: -1.64 },
  { date: new Date('2011-09-21, 12:33:38'),
    qty: 1500,
    symbol: 'ib:JNK',
    exchange: '-',
    avgPx: 38.08998,
    fees: -9.00 },
  { date: new Date('2011-09-21, 12:34:27'),
    qty: 1000,
    symbol: 'ib:JNK',
    exchange: '-',
    avgPx: 38.0890,
    fees: -5.12 },
  { date: new Date('2011-03-15, 05:27:50'),
    qty: 1,
    symbol: 'ib:NKM11',
    exchange: '-',
    avgPx: '8550.0000',
    fees: -318 },
  { date: new Date('2011-03-15, 05:30:47'),
    qty: 1,
    symbol: 'ib:NKM11',
    exchange: '-',
    avgPx: '8580.0000',
    fees: -318 },
  { date: new Date('2011-03-15, 20:27:24'),
    qty: -2,
    symbol: 'ib:NKM11',
    exchange: '-',
    avgPx: '9050.0000',
    fees: -614 },
  { date: new Date('2011-03-16, 13:04:51'),
    qty: 1,
    symbol: 'ib:NKM11',
    exchange: '-',
    avgPx: '8570.0000',
    fees: -307 },
  { date: new Date('2011-03-16, 21:05:30'),
    qty: -1,
    symbol: 'ib:NKM11',
    exchange: '-',
    avgPx: '8790.0000',
    fees: -307 },
  { date: new Date('2011-03-15, 20:29:01'),
    qty: 5961,
    symbol: 'ib:USD.JPY',
    exchange: '-',
    avgPx: 81.1700,
    fees: -2.50 },
  { date: new Date('2011-09-21, 12:31:27'),
    qty: 6557,
    symbol: 'ib:AUD.USD',
    exchange: '-',
    avgPx: 1.0206,
    fees: -2.50 } ]

