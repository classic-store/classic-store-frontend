import type { FinancialSummary, Order, Product } from "../types";

export const initialProducts: Product[] = [
  {
    id: "ps-xbox",
    name: "PlayStation / Xbox",
    status: "Online",
    availability: "Available",
    stockLimit: 1000000,
    pricePerMillion: 75,
    minCoins: 50000,
    maxCoins: 1000000,
  },
  {
    id: "pc",
    name: "PC",
    status: "Offline",
    availability: "Unavailable",
    stockLimit: 0,
    pricePerMillion: 0,
    minCoins: 50000,
    maxCoins: 2000000,
  },
];

export const initialOrders: Order[] = [
  {
    "id": "AWAIS-779287A7-000023",
    "dateTime": "29 Sep 2026 22:50:32",
    "platform": "PS/XB",
    "quantity": 160000,
    "delivered": 0,
    "earning": 0.0,
    "status": "invalid",
    "trackId": "track-awais-779287a7-000023"
  },
  {
    "id": "MATGRCOINS2-95F24B2F-000064",
    "dateTime": "30 Sep 2026 13:47:26",
    "platform": "PS/XB",
    "quantity": 300000,
    "delivered": 0,
    "earning": 0.0,
    "status": "cancelled",
    "trackId": "track-matgrcoins2-95f24b2f-000064"
  },
  {
    "id": "AWAIS-779287A7-000034",
    "dateTime": "30 Sep 2026 13:41:53",
    "platform": "PS/XB",
    "quantity": 750000,
    "delivered": 0,
    "earning": 0.0,
    "status": "cancelled",
    "trackId": "track-awais-779287a7-000034"
  },
  {
    "id": "AWAIS-779287A7-000033",
    "dateTime": "30 Sep 2026 13:39:07",
    "platform": "PS/XB",
    "quantity": 315000,
    "delivered": 0,
    "earning": 0.0,
    "status": "cancelled",
    "trackId": "track-awais-779287a7-000033"
  },
  {
    "id": "AWAIS-779287A7-000022",
    "dateTime": "29 Sep 2026 16:12:40",
    "platform": "PS/XB",
    "quantity": 270000,
    "delivered": 269800,
    "earning": 19.97,
    "status": "completed",
    "trackId": "track-awais-779287a7-000022"
  },
  {
    "id": "AWAIS-779287A7-000021",
    "dateTime": "29 Sep 2026 16:10:23",
    "platform": "PS/XB",
    "quantity": 72000,
    "delivered": 0,
    "earning": 0.0,
    "status": "cancelled",
    "trackId": "track-awais-779287a7-000021"
  },
  {
    "id": "AWAIS-779287A7-000020",
    "dateTime": "28 Sep 2026 22:33:05",
    "platform": "PS/XB",
    "quantity": 225000,
    "delivered": 0,
    "earning": 0.0,
    "status": "cancelled",
    "trackId": "track-awais-779287a7-000020"
  },
  {
    "id": "AWAIS-779287A7-000019",
    "dateTime": "28 Sep 2026 22:31:49",
    "platform": "PS/XB",
    "quantity": 225000,
    "delivered": 225000,
    "earning": 16.65,
    "status": "completed",
    "trackId": "track-awais-779287a7-000019"
  },
  {
    "id": "AWAIS-779287A7-000018",
    "dateTime": "28 Sep 2026 22:30:00",
    "platform": "PS/XB",
    "quantity": 180000,
    "delivered": 0,
    "earning": 0.0,
    "status": "cancelled",
    "trackId": "track-awais-779287a7-000018"
  },
  {
    "id": "AWAIS-779287A7-000017",
    "dateTime": "28 Sep 2026 22:28:56",
    "platform": "PS/XB",
    "quantity": 180000,
    "delivered": 0,
    "earning": 0.0,
    "status": "cancelled",
    "trackId": "track-awais-779287a7-000017"
  },
  {
    "id": "AWAIS-779287A7-000016",
    "dateTime": "27 Sep 2026 23:27:04",
    "platform": "PS/XB",
    "quantity": 750000,
    "delivered": 750000,
    "earning": 63.75,
    "status": "completed",
    "trackId": "track-awais-779287a7-000016"
  },
  {
    "id": "AWAIS-779287A7-000007",
    "dateTime": "26 Sep 2026 15:06:48",
    "platform": "PS/XB",
    "quantity": 150000,
    "delivered": 150000,
    "earning": 11.25,
    "status": "completed",
    "trackId": "track-awais-779287a7-000007"
  },
  {
    "id": "MATGRCOINS2-95F24B2F-000057",
    "dateTime": "25 Sep 2026 21:18:26",
    "platform": "PS/XB",
    "quantity": 350000,
    "delivered": 350000,
    "earning": 29.75,
    "status": "completed",
    "trackId": "track-matgrcoins2-95f24b2f-000057"
  },
  {
    "id": "MATGRCOINS2-95F24B2F-000056",
    "dateTime": "25 Sep 2026 21:16:26",
    "platform": "PS/XB",
    "quantity": 550000,
    "delivered": 550000,
    "earning": 46.75,
    "status": "completed",
    "trackId": "track-matgrcoins2-95f24b2f-000056"
  },
  {
    "id": "AWAIS-779287A7-000006",
    "dateTime": "25 Sep 2026 18:52:37",
    "platform": "PS/XB",
    "quantity": 190000,
    "delivered": 190000,
    "earning": 16.15,
    "status": "completed",
    "trackId": "track-awais-779287a7-000006"
  },
  {
    "id": "AWAIS-779287A7-000004",
    "dateTime": "25 Sep 2026 04:21:43",
    "platform": "PS/XB",
    "quantity": 270000,
    "delivered": 270000,
    "earning": 22.68,
    "status": "completed",
    "trackId": "track-awais-779287a7-000004"
  },
  {
    "id": "AWAIS-779287A7-000003",
    "dateTime": "25 Sep 2026 04:20:00",
    "platform": "PS/XB",
    "quantity": 90000,
    "delivered": 90000,
    "earning": 7.56,
    "status": "completed",
    "trackId": "track-awais-779287a7-000003"
  },
  {
    "id": "AWAIS-779287A7-000002",
    "dateTime": "25 Sep 2026 04:18:12",
    "platform": "PS/XB",
    "quantity": 135000,
    "delivered": 135000,
    "earning": 11.34,
    "status": "completed",
    "trackId": "track-awais-779287a7-000002"
  },
  {
    "id": "AWAIS-779287A7-000001",
    "dateTime": "25 Sep 2026 04:16:55",
    "platform": "PS/XB",
    "quantity": 180000,
    "delivered": 0,
    "earning": 0.0,
    "status": "cancelled",
    "trackId": "track-awais-779287a7-000001"
  },
  {
    "id": "MATGRCOINS2-95F24B2F-000055",
    "dateTime": "25 Sep 2026 03:09:26",
    "platform": "PS/XB",
    "quantity": 150000,
    "delivered": 150000,
    "earning": 12.6,
    "status": "completed",
    "trackId": "track-matgrcoins2-95f24b2f-000055"
  },
  {
    "id": "MATGRCOINS2-95F24B2F-000054",
    "dateTime": "25 Sep 2026 00:34:25",
    "platform": "PS/XB",
    "quantity": 1000000,
    "delivered": 1000000,
    "earning": 84.0,
    "status": "completed",
    "trackId": "track-matgrcoins2-95f24b2f-000054"
  },
  {
    "id": "MATGRCOINS2-95F24B2F-000047",
    "dateTime": "24 Sep 2026 18:03:26",
    "platform": "PS/XB",
    "quantity": 100000,
    "delivered": 100000,
    "earning": 7.5,
    "status": "completed",
    "trackId": "track-matgrcoins2-95f24b2f-000047"
  },
  {
    "id": "MATGRCOINS2-95F24B2F-000046",
    "dateTime": "24 Sep 2026 17:25:26",
    "platform": "PS/XB",
    "quantity": 200000,
    "delivered": 200000,
    "earning": 15.0,
    "status": "completed",
    "trackId": "track-matgrcoins2-95f24b2f-000046"
  },
  {
    "id": "MATGRCOINS2-95F24B2F-000045",
    "dateTime": "24 Sep 2026 17:00:26",
    "platform": "PS/XB",
    "quantity": 350000,
    "delivered": 350000,
    "earning": 27.65,
    "status": "completed",
    "trackId": "track-matgrcoins2-95f24b2f-000045"
  },
  {
    "id": "PROHANG-29446DCA-000004",
    "dateTime": "24 Sep 2026 16:48:37",
    "platform": "PS/XB",
    "quantity": 400000,
    "delivered": 400000,
    "earning": 31.6,
    "status": "completed",
    "trackId": "track-prohang-29446dca-000004"
  },
  {
    "id": "MATGRCOINS2-95F24B2F-000044",
    "dateTime": "24 Sep 2026 16:46:26",
    "platform": "PS/XB",
    "quantity": 750000,
    "delivered": 750000,
    "earning": 59.25,
    "status": "completed",
    "trackId": "track-matgrcoins2-95f24b2f-000044"
  },
  {
    "id": "MATGRCOINS2-95F24B2F-000043",
    "dateTime": "24 Sep 2026 16:34:26",
    "platform": "PS/XB",
    "quantity": 600000,
    "delivered": 600000,
    "earning": 47.4,
    "status": "completed",
    "trackId": "track-matgrcoins2-95f24b2f-000043"
  },
  {
    "id": "PROHANG-29446DCA-000002",
    "dateTime": "24 Sep 2026 16:15:21",
    "platform": "PS/XB",
    "quantity": 1015000,
    "delivered": 1015000,
    "earning": 76.13,
    "status": "completed",
    "trackId": "track-prohang-29446dca-000002"
  },
  {
    "id": "PROHANG-29446DCA-000001",
    "dateTime": "24 Sep 2026 15:50:29",
    "platform": "PS/XB",
    "quantity": 400000,
    "delivered": 400000,
    "earning": 31.6,
    "status": "completed",
    "trackId": "track-prohang-29446dca-000001"
  },
  {
    "id": "MATGRCOINS2-95F24B2F-000042",
    "dateTime": "23 Sep 2026 15:19:11",
    "platform": "PS/XB",
    "quantity": 400000,
    "delivered": 400000,
    "earning": 30.8,
    "status": "completed",
    "trackId": "track-matgrcoins2-95f24b2f-000042"
  },
  {
    "id": "MATGRCOINS2-95F24B2F-000041",
    "dateTime": "23 Sep 2026 15:10:26",
    "platform": "PS/XB",
    "quantity": 500000,
    "delivered": 500000,
    "earning": 38.5,
    "status": "completed",
    "trackId": "track-matgrcoins2-95f24b2f-000041"
  },
  {
    "id": "MATGRCOINS2-95F24B2F-000040",
    "dateTime": "23 Sep 2026 15:07:26",
    "platform": "PS/XB",
    "quantity": 100000,
    "delivered": 100000,
    "earning": 7.7,
    "status": "completed",
    "trackId": "track-matgrcoins2-95f24b2f-000040"
  }
];

export const initialFinancials: FinancialSummary = {
  totalEarned: 715.58,
  paidOut: 0,
  availableBalance: 715.58,
};
