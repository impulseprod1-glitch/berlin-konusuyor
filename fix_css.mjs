import fs from 'fs';

const cssFile = './src/style.css';
let css = fs.readFileSync(cssFile, 'utf8');

// Bulacağımız yer: 
//   .shorts-title {
//     font-size: 1.8rem;
//   }
// }
// 
// }

const searchStr = `  .shorts-title {
    font-size: 1.8rem;
  }
}

}`;

const replaceStr = `  .shorts-title {
    font-size: 1.8rem;
  }
}

/* ── News Catalog Grid ───────────────────────────── */
.news-catalog-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 32px;
  width: 100%;
  margin-top: 40px;
}

.news-card {
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: var(--bg-card);
  -webkit-backdrop-filter: blur(16px);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 24px;
  transition: all 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);
  cursor: pointer;
  box-shadow: 0 10px 30px rgba(0,0,0,0.2);
  height: 100%;
}

.news-card:hover {
  transform: translateY(-8px);
  border-color: var(--accent-glow);
  background: var(--bg-card-hover);
  box-shadow: 0 20px 40px rgba(0,0,0,0.4), 0 0 20px var(--accent-soft);
}

.news-card-img {
  width: 100%;
  aspect-ratio: 16 / 9;
  background-size: cover;
  background-position: center;
  transition: transform 0.8s var(--ease);
}

.news-card:hover .news-card-img {
  transform: scale(1.05);
}

.news-card-content {
  padding: 24px;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.news-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}`;

css = css.replace(searchStr, replaceStr);

fs.writeFileSync(cssFile, css, 'utf8');
console.log('style.css fixed!');
