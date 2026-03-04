<template>
  <!-- Desktop Layout -->
  <div class="resume-page">
  <div class="desktop-only">
    <div id="desktop-hero">
      <canvas id="desktop-canvas"></canvas>
      <div class="dh-overlay">
        <div class="dh-tag">{{ resume.role }}</div>
        <div class="dh-name">{{ resume.name }}</div>
        <div class="dh-sub">{{ resume.nameEn.toUpperCase() }} · BEIJING · {{ resume.contact[0].text }}</div>
      </div>
    </div>
    <div class="desktop-page">
      <aside class="d-sidebar">
        <div>
          <div class="d-avatar">张</div>
          <div class="d-name-cn">{{ resume.name.split('').join(' ') }}</div>
          <div class="d-name-en">{{ resume.nameEn }}</div>
        </div>
        <div>
          <div class="d-s-label">联系方式</div>
          <ul class="d-contact-list">
            <li v-for="c in resume.contact" :key="c.text">
              <span class="icon">{{ c.icon }}</span> {{ c.text }}
            </li>
          </ul>
        </div>
        <div>
          <div class="d-s-label">技术能力</div>
          <ul class="d-skill-list">
            <li class="d-skill-item" v-for="s in resume.skills" :key="s.name">
              <div class="d-skill-name"><span>{{ s.name }}</span><span>{{ s.pct }}%</span></div>
              <div class="d-bar-bg"><div class="d-bar-fill" :style="{width: s.pct+'%'}"></div></div>
            </li>
          </ul>
        </div>
        <div>
          <div class="d-s-label">工具 & 框架</div>
          <div class="d-tag-list">
            <span class="d-tag" v-for="t in resume.tools" :key="t">{{ t }}</span>
          </div>
        </div>
        <div>
          <div class="d-s-label">语言</div>
          <ul class="d-contact-list">
            <li v-for="l in resume.langs" :key="l.label">
              <span class="icon">·</span> {{ l.label }}（{{ l.value }}）
            </li>
          </ul>
        </div>
      </aside>
      <main class="d-main">
        <div class="d-header">
          <div class="d-role">{{ resume.role }}</div>
          <h1>Software<br>Engineer</h1>
          <p class="d-summary">{{ resume.summary }}</p>
        </div>
        <div>
          <div class="d-sec-head"><h2>工作经历</h2></div>
          <div class="d-exp-list">
            <div class="d-exp-item" v-for="job in resume.work" :key="job.title">
              <div class="d-exp-title">{{ job.title }}</div>
              <div class="d-exp-company">{{ job.company }}</div>
              <div class="d-exp-date">{{ job.date }}</div>
              <ul class="d-exp-desc"><li v-for="p in job.points" :key="p">{{ p }}</li></ul>
            </div>
          </div>
        </div>
        <div>
          <div class="d-sec-head"><h2>教育背景</h2></div>
          <div class="d-edu-list">
            <div class="d-edu-item" v-for="e in resume.edu" :key="e.degree">
              <div>
                <div class="d-edu-degree">{{ e.degree }}</div>
                <div class="d-edu-school">{{ e.school }}</div>
              </div>
              <div class="d-edu-date">{{ e.date }}</div>
            </div>
          </div>
        </div>
        <div>
          <div class="d-sec-head"><h2>项目 & 荣誉</h2></div>
          <div class="d-exp-list">
            <div class="d-exp-item" v-for="p in resume.projects" :key="p.title">
              <div class="d-exp-title">{{ p.title }}</div>
              <div class="d-exp-date">{{ p.date }}</div>
              <div class="d-exp-company">{{ p.sub }}</div>
              <ul class="d-exp-desc" v-if="p.points.length">
                <li v-for="pt in p.points" :key="pt">{{ pt }}</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>

  <!-- Mobile Layout -->
  <div class="mobile-only m-shell">
    <div class="m-status">
      <span class="m-clock">{{ clock }}</span>
      <div class="m-icons">
        <svg viewBox="0 0 18 12" fill="white" opacity="0.85"><rect x="0" y="5" width="3" height="7" rx=".5"/><rect x="4" y="3" width="3" height="9" rx=".5" opacity=".75"/><rect x="8" y="1" width="3" height="11" rx=".5" opacity=".55"/><rect x="12" y="0" width="3" height="12" rx=".5" opacity=".35"/></svg>
        <svg viewBox="0 0 20 14" stroke="white" stroke-width="1.8" fill="none" opacity="0.85"><path d="M1 5a12 12 0 0 1 18 0"/><path d="M4 8.5a8 8 0 0 1 12 0"/><path d="M7.5 12a4 4 0 0 1 5 0"/><circle cx="10" cy="14" r="1" fill="white" stroke="none"/></svg>
        <svg viewBox="0 0 24 12" fill="none" opacity="0.85"><rect x=".5" y=".5" width="20" height="11" rx="2.5" stroke="white" stroke-width="1.2"/><path d="M22 4v4a2 2 0 0 0 0-4z" fill="white"/><rect x="2" y="2" width="14" height="8" rx="1.5" fill="white"/></svg>
      </div>
    </div>
    <div class="m-screens">
      <div class="m-screen" :class="{ active: activeTab==='home' }" id="ms-home">
        <div id="mobile-canvas-wrap">
          <canvas id="mobile-canvas"></canvas>
          <div class="m-hero-overlay">
            <div class="m-hero-tag">Software Engineer · 全栈工程师</div>
            <div class="m-hero-name">张明远</div>
            <div class="m-hero-sub">ZHANG MINGYUAN · 5 YRS EXP</div>
            <div class="m-hero-avatar">张</div>
          </div>
        </div>
        <div class="m-inner">
          <div class="m-sec-title">概览</div>
          <div class="m-stat-row">
            <div class="m-stat-chip"><div class="m-stat-num">5</div><div class="m-stat-lbl">年经验</div></div>
            <div class="m-stat-chip"><div class="m-stat-num">3</div><div class="m-stat-lbl">家公司</div></div>
            <div class="m-stat-chip"><div class="m-stat-num">12+</div><div class="m-stat-lbl">个项目</div></div>
          </div>
          <div class="m-card">
            <div class="m-card-title">个人简介</div>
            <div class="m-card-body" style="margin-top:9px">{{ resume.summary }}</div>
          </div>
          <div class="m-sec-title">最新职位</div>
          <div class="m-card" style="cursor:pointer" @click="switchTab('work')">
            <div class="m-card-row">
              <div>
                <div class="m-card-title">{{ resume.work[0].title }}</div>
                <div class="m-card-sub">{{ resume.work[0].company }}</div>
              </div>
              <div class="m-card-date">{{ resume.work[0].dateM[0] }}<br>{{ resume.work[0].dateM[1] }}</div>
            </div>
            <ul class="m-card-body">
              <li v-for="p in resume.work[0].points.slice(0,2)" :key="p">{{ p }}</li>
            </ul>
            <div class="m-cta">查看全部经历 ›</div>
          </div>
          <div class="m-card m-award-card">
            <div class="m-award-icon">🏆</div>
            <div class="m-card-title">字节跳动最佳创新奖</div>
            <div class="m-card-body" style="margin-top:4px">2023 年度内部技术奖，表彰 A/B 实验平台创新落地</div>
          </div>
        </div>
      </div>
      <div class="m-screen" :class="{ active: activeTab==='work' }" id="ms-work">
        <div class="m-inner" style="padding-top:16px">
          <div class="m-sec-title">工作经历</div>
          <div class="m-card" v-for="job in resume.work" :key="job.title" style="margin-bottom:10px">
            <div class="m-card-row">
              <div>
                <div class="m-card-title">{{ job.title }}</div>
                <div class="m-card-sub">{{ job.company }}</div>
              </div>
              <div class="m-card-date">{{ job.dateM[0] }}<br>{{ job.dateM[1] }}</div>
            </div>
            <ul class="m-card-body"><li v-for="p in job.points" :key="p">{{ p }}</li></ul>
          </div>
          <div class="m-sec-title">教育背景</div>
          <div class="m-card" v-for="e in resume.edu" :key="e.degree" style="margin-bottom:10px">
            <div class="m-card-row">
              <div>
                <div class="m-card-title">{{ e.degree }}</div>
                <div class="m-card-sub">{{ e.school.split('·')[1]?.trim() || e.school }}</div>
              </div>
              <div class="m-card-date">{{ e.dateM[0] }}<br>{{ e.dateM[1] }}</div>
            </div>
          </div>
        </div>
      </div>
      <div class="m-screen" :class="{ active: activeTab==='skills' }" id="ms-skills">
        <div class="m-inner" style="padding-top:16px">
          <div class="m-sec-title">技术能力</div>
          <div class="m-card">
            <div class="m-skill-row" v-for="s in resume.skills" :key="s.name">
              <div class="m-skill-label"><span>{{ s.name }}</span><span class="m-skill-pct">{{ s.pct }}%</span></div>
              <div class="m-bar-bg"><div class="m-bar-fill" :style="{width:s.pct+'%'}"></div></div>
            </div>
          </div>
          <div class="m-sec-title">工具 & 框架</div>
          <div class="m-card">
            <div class="m-tag-wrap">
              <span class="m-tag" v-for="t in resume.tools" :key="t">{{ t }}</span>
            </div>
          </div>
          <div class="m-sec-title">项目 & 荣誉</div>
          <div class="m-card m-award-card">
            <div class="m-award-icon">⭐</div>
            <div class="m-card-title">FastSchema · 开源项目</div>
            <div class="m-card-sub" style="color:var(--m-accent2);margin-bottom:6px">GitHub 1.2k Stars</div>
            <div class="m-card-body">基于 Python 的轻量级数据验证与 ORM 框架，已被 200+ 项目引用</div>
          </div>
          <div class="m-card m-award-card">
            <div class="m-award-icon">🏆</div>
            <div class="m-card-title">字节跳动最佳创新奖</div>
            <div class="m-card-sub" style="color:var(--m-accent2);margin-bottom:6px">2023.12</div>
            <div class="m-card-body">A/B 实验平台从 0 到 1 落地，接入 30+ 业务线</div>
          </div>
          <div class="m-sec-title">语言能力</div>
          <div class="m-info-grid">
            <div class="m-info-cell" v-for="l in resume.langs" :key="l.label">
              <div class="m-ic-label">{{ l.label }}</div>
              <div class="m-ic-value">{{ l.value }}</div>
            </div>
          </div>
        </div>
      </div>
      <div class="m-screen" :class="{ active: activeTab==='settings' }" id="ms-settings">
        <div style="padding-bottom:100px">
          <div class="m-settings-header">设置</div>
          <div class="m-profile-card">
            <div class="m-pca-avatar">张</div>
            <div><div class="m-pca-name">张明远</div><div class="m-pca-role">高级软件工程师 · 字节跳动</div></div>
          </div>
          <div class="m-settings-slabel">联系方式</div>
          <div class="m-settings-list">
            <div class="m-settings-row"><div class="m-settings-icon" style="background:rgba(232,69,69,.15)">✉️</div><div class="m-settings-label">{{ resume.contact[0].text }}</div><span class="m-settings-arrow">›</span></div>
            <div class="m-settings-row"><div class="m-settings-icon" style="background:rgba(80,200,80,.12)">📱</div><div class="m-settings-label">{{ resume.contact[1].text }}</div><span class="m-settings-arrow">›</span></div>
            <div class="m-settings-row"><div class="m-settings-icon" style="background:rgba(100,150,255,.12)">🐙</div><div class="m-settings-label">{{ resume.contact[3].text }}</div><span class="m-settings-arrow">›</span></div>
            <div class="m-settings-row"><div class="m-settings-icon" style="background:rgba(255,200,50,.12)">📍</div><div class="m-settings-label">{{ resume.contact[2].text }}</div><span class="m-settings-arrow">›</span></div>
          </div>
          <div class="m-settings-slabel">偏好设置</div>
          <div class="m-settings-list">
            <div class="m-settings-row">
              <div class="m-settings-icon" style="background:rgba(255,150,50,.12)">✨</div>
              <div class="m-settings-label">粒子动效背景</div>
              <div :class="['m-toggle', animOn ? 'm-toggle-on' : 'm-toggle-off']" @click="toggleAnim"></div>
            </div>
          </div>
          <div class="m-settings-slabel">关于</div>
          <div class="m-settings-list">
            <div class="m-settings-row"><div class="m-settings-icon" style="background:rgba(255,255,255,.06)">📄</div><div class="m-settings-label">下载 PDF 版本</div><span class="m-settings-arrow">›</span></div>
            <div class="m-settings-row"><div class="m-settings-icon" style="background:rgba(255,255,255,.06)">ℹ️</div><div class="m-settings-label">简历版本</div><span class="m-settings-value">v3.1</span><span class="m-settings-arrow">›</span></div>
          </div>
        </div>
      </div>
    </div>
    <div class="m-tab-bar">
      <div v-for="t in tabs" :key="t.id"
        class="m-tab"
        :style="{ color: activeTab===t.id ? 'var(--m-accent)' : 'var(--m-muted)' }"
        @click="switchTab(t.id)">
        <div class="m-tab-indicator" :style="{ opacity: activeTab===t.id ? 1 : 0 }"></div>
        <div class="m-tab-icon" :style="{ transform: activeTab===t.id ? 'translateY(-2px)' : 'none' }">
          <svg viewBox="0 0 24 24"
            :style="{ stroke: activeTab===t.id ? 'var(--m-accent)' : 'var(--m-muted)' }">
            <path :d="t.path"/>
          </svg>
        </div>
        <span class="m-tab-label">{{ t.label }}</span>
      </div>
    </div>
  </div>
</div>
</template>

<script>
import { ref, onMounted } from 'vue';
import * as THREE from 'three';

const RESUME = {
  name: '张明远',
  nameEn: 'Zhang Mingyuan',
  role: '高级全栈工程师 · 5年经验',
  roleEn: 'SOFTWARE ENGINEER',
  summary: '专注于构建高性能、可扩展的 Web 应用与 AI 产品，拥有丰富的后端架构与前端交互设计经验。热衷于用技术解决真实问题，善于跨团队协作推动项目落地。',
  contact: [
    { icon: '✉', text: 'zhang.my@email.com' },
    { icon: '✆', text: '138 0000 0000' },
    { icon: '⌖', text: '北京市朝阳区' },
    { icon: '↗', text: 'github.com/zhangmy' },
  ],
  skills: [
    { name: 'Python', pct: 95 },
    { name: 'React / TypeScript', pct: 88 },
    { name: '机器学习', pct: 82 },
    { name: '云原生 / K8s', pct: 75 },
    { name: '数据库设计', pct: 80 },
    { name: '系统架构', pct: 78 },
  ],
  tools: ['PyTorch','FastAPI','Docker','Redis','PostgreSQL','Kafka','Git','Linux','Figma','Spark','gRPC','Nginx'],
  langs: [{ label:'普通话', value:'母语' }, { label:'英语', value:'CET-6 · 流利' }],
  work: [
    {
      title: '高级软件工程师', company: '字节跳动 · 商业化技术团队', date: '2022.06 — 至今',
      dateM: ['2022.06','至今'],
      points: ['主导重构广告投放核心链路，QPS 提升 3 倍，P99 延迟从 120ms 降至 38ms','设计并落地特征工程平台，支撑日均千亿级特征计算，节省算力成本 40%','带领 5 人小组完成 A/B 实验平台从 0 到 1，已接入 30+ 业务线']
    },
    {
      title: '全栈开发工程师', company: '美团 · 到店事业群', date: '2020.07 — 2022.05',
      dateM: ['2020.07','2022.05'],
      points: ['独立负责商家端 SaaS 管理平台前后端开发（React + FastAPI），日活 8 万+','优化搜索排序算法，CTR 提升 12%，推动营收增长约 200 万元/月','建立前端组件库规范，覆盖团队 90% 通用场景，研发效率提升 30%']
    },
    {
      title: '后端开发实习生', company: '阿里云 · 中间件团队', date: '2019.07 — 2020.06',
      dateM: ['2019.07','2020.06'],
      points: ['参与 RocketMQ 消息队列 SDK 的 Python 版本维护与性能优化','完成内部监控大盘数据接口开发，日均请求量 500 万次']
    },
  ],
  edu: [
    { degree:'计算机科学与技术 · 硕士', school:'BEIHANG UNIVERSITY · 北京航空航天大学', date:'2017 — 2020', dateM:['2017','2020'] },
    { degree:'软件工程 · 学士', school:'SOUTHEAST UNIVERSITY · 东南大学', date:'2013 — 2017', dateM:['2013','2017'] },
  ],
  projects: [
    { title:'开源项目 · FastSchema', sub:'GitHub 1.2k ⭐', date:'2023', points:['基于 Python 的轻量级数据验证与 ORM 框架，已被 200+ 项目引用'] },
    { title:'字节跳动内部技术奖 · 最佳创新奖', sub:'BYTEDANCE INTERNAL AWARD', date:'2023.12', points:[] },
  ],
};

export default {
  setup() {
    const activeTab = ref('home');
    const animOn = ref(true);
    const clock = ref('9:41');
    let particleCtrlDesktop = null;
    let particleCtrlMobile = null;

    const tabs = [
      { id:'home', label:'主页', path:'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10' },
      { id:'work', label:'经历', path:'M2 7h20a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2' },
      { id:'skills', label:'技能', path:'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z' },
      { id:'settings', label:'设置', path:'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z' },
    ];

    function makeParticles(canvas, wrap) {
      if (!canvas || !wrap) return null;
      const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setClearColor(0xf1f5f9, 1);
      const scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0xf1f5f9, 0.028)
      const camera = new THREE.PerspectiveCamera(65, 1, 0.1, 100);
      camera.position.z = 5;

      function resize() {
        const w = wrap.clientWidth, h = wrap.clientHeight;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      }
      resize();

      const COUNT = 300;
      const pos = new Float32Array(COUNT * 3);
      const vel = new Float32Array(COUNT * 3);
      for (let i = 0; i < COUNT; i++) {
        pos[i*3]   = (Math.random()-.5)*13;
        pos[i*3+1] = (Math.random()-.5)*6.5;
        pos[i*3+2] = (Math.random()-.5)*4;
        vel[i*3]   = (Math.random()-.5)*0.005;
        vel[i*3+1] = (Math.random()-.5)*0.003;
      }
      const geo = new THREE.BufferGeometry();
      const posAttr = new THREE.BufferAttribute(pos, 3);
      geo.setAttribute('position', posAttr);
      scene.add(new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xe84545, size: 0.05, transparent: true, opacity: 0.65, sizeAttenuation: true })));

      const lMat = new THREE.LineBasicMaterial({ color: 0x6a1515, transparent: true, opacity: 0.3 });
      let linesMesh = null, lf = 0;
      function buildLines() {
          if (linesMesh) {
              scene.remove(linesMesh);
              linesMesh.geometry.dispose();
          }

          const v = [];
          const DIST2 = 1.4 * 1.4;
          const MAX_LINKS = 20; // 每个粒子最多连 20 条，调大调小都行
          const connCount = new Uint8Array(COUNT);

          for (let i = 0; i < COUNT; i++) {
              if (connCount[i] >= MAX_LINKS)
                  continue;
              for (let j = i + 1; j < COUNT; j++) {
                  if (connCount[i] >= MAX_LINKS)
                      break;
                  if (connCount[j] >= MAX_LINKS)
                      continue;

                  const dx = pos[i * 3] - pos[j * 3];
                  const dy = pos[i * 3 + 1] - pos[j * 3 + 1];
                  const dz = pos[i * 3 + 2] - pos[j * 3 + 2];
                  if (dx * dx + dy * dy + dz * dz < DIST2) {
                      v.push(
                          pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2],
                          pos[j * 3], pos[j * 3 + 1], pos[j * 3 + 2], );
                      connCount[i]++;
                      connCount[j]++;
                  }
              }
          }

          const lg = new THREE.BufferGeometry();
          lg.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
          linesMesh = new THREE.LineSegments(lg, lMat);
          scene.add(linesMesh);
      }
      buildLines();

      const mouse = { x:0, y:0 };
      const onMouseMove = e => { const r=wrap.getBoundingClientRect(); mouse.x=((e.clientX-r.left)/r.width-.5)*2; mouse.y=((e.clientY-r.top)/r.height-.5)*-2; };
      const onTouchMove = e => { const r=wrap.getBoundingClientRect(),t=e.touches[0]; mouse.x=((t.clientX-r.left)/r.width-.5)*2; mouse.y=((t.clientY-r.top)/r.height-.5)*-2; };
      wrap.addEventListener('mousemove', onMouseMove);
      wrap.addEventListener('touchmove', onTouchMove, { passive:true });

      let running = true;
      (function animate() {
        requestAnimationFrame(animate);
        if (!running) return;
        for (let i = 0; i < COUNT; i++) {
          pos[i*3]+=vel[i*3]; pos[i*3+1]+=vel[i*3+1];
          const dx=pos[i*3]-mouse.x*5.5, dy=pos[i*3+1]-mouse.y*2.8, d2=dx*dx+dy*dy;
          if (d2<2.25&&d2>0.001){const d=Math.sqrt(d2),f=(1.5-d)/1.5*0.01;vel[i*3]+=dx/d*f;vel[i*3+1]+=dy/d*f;}
          vel[i*3]*=0.994; vel[i*3+1]*=0.994;
          if(pos[i*3]>7)pos[i*3]=-7; if(pos[i*3]<-7)pos[i*3]=7;
          if(pos[i*3+1]>3.5)pos[i*3+1]=-3.5; if(pos[i*3+1]<-3.5)pos[i*3+1]=3.5;
        }
        posAttr.needsUpdate = true;
        if(++lf%2===0) buildLines();
        camera.position.x+=(mouse.x*.25-camera.position.x)*.025;
        camera.position.y+=(mouse.y*.12-camera.position.y)*.025;
        camera.lookAt(0,0,0);
        renderer.render(scene, camera);
      })();

      window.addEventListener('resize', resize);
      return { setRunning: v => running = v };
    }

    function switchTab(tab) {
      activeTab.value = tab;
      const el = document.getElementById('ms-' + tab);
      if (el) el.scrollTop = 0;
    }

    function toggleAnim() {
      animOn.value = !animOn.value;
      if (particleCtrlDesktop) particleCtrlDesktop.setRunning(animOn.value);
      if (particleCtrlMobile) particleCtrlMobile.setRunning(animOn.value);
    }

    function updateClock() {
      const n = new Date();
      clock.value = String(n.getHours()).padStart(2,'0') + ':' + String(n.getMinutes()).padStart(2,'0');
    }

    onMounted(() => {
      updateClock();
      setInterval(updateClock, 15000);
      particleCtrlDesktop = makeParticles(document.getElementById('desktop-canvas'), document.getElementById('desktop-hero'));
      particleCtrlMobile = makeParticles(document.getElementById('mobile-canvas'), document.getElementById('mobile-canvas-wrap'));
    });

    return { resume: RESUME, activeTab, animOn, clock, tabs, switchTab, toggleAnim };
  }
};
</script>
<style scoped>
  @import './style.css';
</style>
