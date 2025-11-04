// TODO Backend Server
const path = require('path');
const dotenv = require('dotenv');

// .env 파일 로드 (명시적 경로 지정)
const envPath = path.resolve(__dirname, '.env');
const envResult = dotenv.config({ 
  path: envPath,
  encoding: 'utf8'
});

// dotenv 로딩 확인
if (envResult.error) {
  console.error('❌ .env 파일 로딩 실패:', envResult.error.message);
  process.exit(1);
}

const express = require('express');
const mongoose = require('mongoose');
const todoRoutes = require('./routers/todoRouter');

const app = express();
const PORT = process.env.PORT || 5174;

// MongoDB URI 가져오기
let MONGODB_URI = process.env.MONGO_URI;

// 환경변수 확인
if (!MONGODB_URI) {
  console.warn('⚠️  환경변수 MONGO_URI가 설정되지 않았습니다. 기본값을 사용합니다.');
  MONGODB_URI = 'mongodb://localhost:27017/todo-db';
} else {
  console.log('✅ 환경변수 MONGO_URI가 설정되었습니다.');
  // URI가 /로 끝나는 경우 데이터베이스 이름 추가
  if (MONGODB_URI.endsWith('/')) {
    MONGODB_URI = MONGODB_URI + 'todo-db';
  } else if (!MONGODB_URI.split('/').pop() || MONGODB_URI.split('/').pop().includes('?')) {
    // 데이터베이스 이름이 없거나 옵션이 있는 경우
    const baseUri = MONGODB_URI.split('?')[0];
    const options = MONGODB_URI.includes('?') ? '?' + MONGODB_URI.split('?')[1] : '';
    MONGODB_URI = baseUri + (baseUri.endsWith('/') ? '' : '/') + 'todo-db' + options;
  }
}

// 디버깅: 사용 중인 MongoDB URI 확인 (비밀번호는 마스킹)
const maskedUri = MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//$1:***@');
console.log('📡 사용 중인 MongoDB URI:', maskedUri);

// CORS 설정 (프론트엔드와 백엔드가 다른 포트에서 실행될 때 필요)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*'); // 개발 환경에서는 모든 origin 허용
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  // OPTIONS 요청 처리 (preflight)
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

// JSON 파싱 미들웨어
app.use(express.json());

// 정적 파일 서빙 (프론트엔드)
app.use(express.static('public'));

// MongoDB 연결 옵션
const mongooseOptions = {
  // 자동으로 데이터베이스 이름 추출
};

// MongoDB 연결 (비동기로 처리, 서버는 바로 시작)
mongoose.connect(MONGODB_URI, mongooseOptions)
  .then(() => {
    console.log('✅ MongoDB 연결 성공');
    const dbName = mongoose.connection.db.databaseName;
    console.log(`📦 데이터베이스 이름: ${dbName}`);
  })
  .catch((error) => {
    console.error('❌ MongoDB 연결 실패:', error.message);
    console.warn('⚠️  서버는 MongoDB 없이 실행됩니다. 데이터베이스 기능은 사용할 수 없습니다.');
  });

// MongoDB 연결 상태 확인 미들웨어 (API 라우트에만 적용)
app.use('/api', (req, res, next) => {
  const readyState = mongoose.connection.readyState;
  // readyState: 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  if (readyState !== 1) {
    console.warn(`⚠️  MongoDB 연결 상태 문제: readyState=${readyState}, 요청 경로: ${req.path}`);
    return res.status(503).json({
      success: false,
      message: '데이터베이스에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.',
      error: `MongoDB 연결 상태: ${readyState} (0=disconnected, 1=connected, 2=connecting, 3=disconnecting)`
    });
  }
  next();
});

// 라우터 연결
app.use('/api/todos', todoRoutes);

// API 상태 확인 라우트 (정적 파일과 충돌하지 않도록 /status 경로 사용)
app.get('/status', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.json({
    message: 'TODO Backend Server is running!',
    status: 'ok',
    database: dbStatus
  });
});

// 서버 시작 (MongoDB 연결과 관계없이)
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  if (mongoose.connection.readyState !== 1) {
    console.warn('⚠️  MongoDB 연결 대기 중...');
  }
});




