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
    // 去除查詢字串的前後空格
    const sanitizedQuery = query.trim();
    
    // 如果有空格，將查詢字串分割成多個詞
    const queryParts = sanitizedQuery.split(/\s+/);  // 使用空格分割字串

    // 構造查詢條件，對每個字詞使用正則表達式
    const regexConditions = queryParts.map(part => ({
      $regex: `.*${part}.*`,  // 使用正則表達式來模糊匹配字詞
      $options: 'i'  // 忽略大小寫
    }));

    // 查詢 "樣品名稱" 欄位，使用 $or 查詢任意一個字詞匹配
    const foods = await mongoose.connection.db.collection('food').find({
      $or: regexConditions.map(cond => ({
        '樣品名稱': cond  // 查詢每個條件
      }))
    }).toArray();  // 將結果轉換為陣列

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
