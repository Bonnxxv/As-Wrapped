const fs = require('fs');

const path = './src/components/DashboardView.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Add getMetrics helper
const getMetricsStr = `
  const getMetrics = (item: ContentEntry) => {
    if (activeView === 'instagram') return item.instagram;
    if (activeView === 'tiktok') return item.tiktok;
    return {
      views: item.instagram.views + item.tiktok.views,
      likes: item.instagram.likes + item.tiktok.likes,
      comments: item.instagram.comments + item.tiktok.comments,
      saves: item.instagram.saves + item.tiktok.saves,
      shares: item.instagram.shares + item.tiktok.shares,
    };
  };

  const fmtFull = (n: number) => {`;

code = code.replace('  const fmtFull = (n: number) => {', getMetricsStr);

// 2. Remove platform filters in getYearContents
const getYearContentsBefore = `      monthContents.forEach(item => {
        if (activeView === 'instagram' && item.platform !== 'instagram') return;
        if (activeView === 'tiktok' && item.platform !== 'tiktok') return;
        list.push(item);
      });`;
const getYearContentsAfter = `      monthContents.forEach(item => {
        list.push(item);
      });`;
code = code.replace(getYearContentsBefore, getYearContentsAfter);

// 3. Update year calculations
code = code.replace(/sum \+ item\.views/g, 'sum + getMetrics(item).views');
code = code.replace(/sum \+ item\.likes/g, 'sum + getMetrics(item).likes');
code = code.replace(/sum \+ item\.comments/g, 'sum + getMetrics(item).comments');
code = code.replace(/item\.views \> 20000/g, 'getMetrics(item).views > 20000');

// 4. Update MOM Chart Data filters
const momFilterBefore = `    const mPlatformContents = mContents.filter(item => {
      if (activeView === 'instagram') return item.platform === 'instagram';
      if (activeView === 'tiktok') return item.platform === 'tiktok';
      return true;
    });`;
const momFilterAfter = `    const mPlatformContents = mContents;`;
code = code.replace(momFilterBefore, momFilterAfter);

const momPrevFilterBefore = `    const prevMPlatformContents = prevMContents.filter(item => {
      if (activeView === 'instagram') return item.platform === 'instagram';
      if (activeView === 'tiktok') return item.platform === 'tiktok';
      return true;
    });`;
const momPrevFilterAfter = `    const prevMPlatformContents = prevMContents;`;
code = code.replace(momPrevFilterBefore, momPrevFilterAfter);

// 5. Update selectedMonthContents filter
const selMonthBefore = `  const selectedMonthContents = (folders[selectedYear]?.[selectedMonth] || []).filter(item => {
    if (activeView === 'instagram') return item.platform === 'instagram';
    if (activeView === 'tiktok') return item.platform === 'tiktok';
    return true;
  });`;
const selMonthAfter = `  const selectedMonthContents = folders[selectedYear]?.[selectedMonth] || [];`;
code = code.replace(selMonthBefore, selMonthAfter);

// 6. Update prevMonthContents filter
const prevMonthBefore = `  const prevMonthContents = (folders[prevMYr]?.[prevMIdx] || []).filter(item => {
    if (activeView === 'instagram') return item.platform === 'instagram';
    if (activeView === 'tiktok') return item.platform === 'tiktok';
    return true;
  });`;
const prevMonthAfter = `  const prevMonthContents = folders[prevMYr]?.[prevMIdx] || [];`;
code = code.replace(prevMonthBefore, prevMonthAfter);

// 7. Sort bestContents
const sortBefore = `const sortedContents = [...selectedMonthContents].sort((a, b) => b.views - a.views);`;
const sortAfter = `const sortedContents = [...selectedMonthContents].sort((a, b) => getMetrics(b).views - getMetrics(a).views);`;
code = code.replace(sortBefore, sortAfter);

// 8. Update Top Performing Content rendering (lines 431+ and 650+)
// Replace content.views with getMetrics(content).views
code = code.replace(/fmtFull\(content\.views\)/g, 'fmtFull(getMetrics(content).views)');
code = code.replace(/fmtFull\(content\.likes\)/g, 'fmtFull(getMetrics(content).likes)');
code = code.replace(/fmtFull\(content\.comments\)/g, 'fmtFull(getMetrics(content).comments)');
code = code.replace(/fmtFull\(content\.saves\)/g, 'fmtFull(getMetrics(content).saves)');

// For shares and platforms:
// Since there's no content.platform anymore, the UI in DashboardView rendering needs updates
// In activeView === 'dashboard', we can just show generic icons or both.
code = code.replace(/{content\.platform === 'instagram' \? <InstagramIcon size={10} \/> : <TikTokIcon size={10} \/>}/g, '<InstagramIcon size={10} /><TikTokIcon size={10} />');
code = code.replace(/{content\.platform === 'instagram' \? 'Instagram' : 'TikTok'} • Day {content\.day}/g, 'Mirrored • Day {content.day}');

// For the shares text logic:
code = code.replace(/fmtFull\(content\.platform === 'tiktok' \? content\.reposts : content\.shares\)/g, 'fmtFull(getMetrics(content).shares)');
code = code.replace(/{content\.platform === 'tiktok' \? 'Reposts' : 'Shares'}/g, 'Shares');


fs.writeFileSync(path, code);
console.log('Patched DashboardView.tsx');
