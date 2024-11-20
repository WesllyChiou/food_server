const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// 設定 Express 應用程式
const app = express();
const PORT = process.env.PORT || 3000;

// 這段中間件會在所有請求進來時記錄請求信息
app.use((req, res, next) => {
  console.log(`Received request: ${req.method} ${req.url}`);
  next();
});

//app.use(cors());
// 允許跨域請求
app.use(
  cors({
    origin: "https://food-vue.onrender.com", // 替換成您的 Vue 項目部署的域名
    methods: ["GET", "POST"],
  })
);

app.use(express.json());

// MongoDB 連線字串
const dbURI = "mongodb+srv://leweivictory:NOxXkux7mjFvXetz@cluster0.sti8h.mongodb.net/WesleyTest?retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.log('MongoDB connection error:', err));

// 設置 API 路由
app.get('/api/search', async (req, res) => {
  const { query } = req.query;
  if (!query) {
    return res.status(400).send('Query parameter is required');
  }

  try {
    // 去除查詢字串的前後空格，並分割字串為各個字詞
    const sanitizedQuery = query.trim();
    const queryParts = sanitizedQuery.split(/\s+/);  // 以空格分割字串，保留每個單字

    // 首先嘗試完全匹配的情況
    const exactMatchQuery = sanitizedQuery;

    // 如果完全匹配結果為空，則進行逐字詞匹配
    const regexConditions = queryParts.map(part => ({
      $regex: `.*${part}.*`,  // 使用正則表達式來模糊匹配字詞
      $options: 'i'  // 忽略大小寫
    }));

    // 查詢食物名稱或俗名中完全匹配的情況
    let foods = await mongoose.connection.db.collection('food').find({
      $or: [
        { '樣品名稱': { $regex: `.*${exactMatchQuery}.*`, $options: 'i' } },  // 完全匹配食物名稱
        { '俗名': { $regex: `.*${exactMatchQuery}.*`, $options: 'i' } }  // 完全匹配食物俗名
      ]
    }).toArray();

    // 如果沒有結果，則進行逐字詞匹配
    if (foods.length === 0) {
      foods = await mongoose.connection.db.collection('food').find({
        $or: [
          { '樣品名稱': { $regex: regexConditions[0], $options: 'i' } },  // 查詢食物名稱，匹配第一個字詞
          { '俗名': { $regex: regexConditions[0], $options: 'i' } }  // 查詢食物俗名，匹配第一個字詞
        ]
      }).toArray();  // 將結果轉換為陣列
    }

    res.json(foods);  // 返回查詢結果
  } catch (err) {
    console.error('Error searching foods:', err);
    res.status(500).send('Internal Server Error');
  }
});

    // 啟動伺服器
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server is running on http://0.0.0.0:${PORT}`);
    });
