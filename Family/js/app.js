// 全局变量
let familyData = null;
let treeSvg, treeG;
let currentTransform = d3.zoomIdentity;

// DOM元素
const loadingElement = document.getElementById('loading');
const defaultViewElement = document.getElementById('default-view');
const memberDetailsElement = document.getElementById('member-details');
const searchInput = document.getElementById('search');
const zoomInBtn = document.getElementById('zoom-in');
const zoomOutBtn = document.getElementById('zoom-out');
const resetBtn = document.getElementById('reset');

// 初始化应用
document.addEventListener('DOMContentLoaded', function() {
    // 绑定按钮事件
    zoomInBtn.addEventListener('click', zoomIn);
    zoomOutBtn.addEventListener('click', zoomOut);
    resetBtn.addEventListener('click', resetZoom);
    searchInput.addEventListener('input', searchMember);
    
    // 加载数据
    loadFamilyData();
    
    // 添加窗口大小变化监听
    window.addEventListener('resize', handleResize);
});

// 处理窗口大小变化
function handleResize() {
    if (familyData) {
        d3.select('#tree svg').remove();
        initTree();
    }
}

// 加载家族数据
async function loadFamilyData() {
    try {
        showLoading(true);
        
        // 从外部JSON文件加载数据
        const response = await fetch('data/family-data.json');
        if (!response.ok) {
            throw new Error(`HTTP错误! 状态码: ${response.status}`);
        }
        
        familyData = await response.json();
        
        // 初始化树状图
        initTree();
        
    } catch (error) {
        console.error('加载数据失败:', error);
        showError('加载家族数据失败: ' + error.message);
    } finally {
        showLoading(false);
    }
}

// 初始化树状图
function initTree() {
    const container = document.getElementById('tree');
    const width = container.clientWidth;
    
    // 根据屏幕尺寸调整高度
    const isMobile = window.matchMedia("(max-width: 576px)").matches;
    const height = isMobile ? width * 1.2 : 600;
    
    // 创建SVG
    treeSvg = d3.select('#tree')
        .append('svg')
        .attr('width', width)
        .attr('height', height);
    
    // 创建缩放组
    treeG = treeSvg.append('g');
    
    // 设置缩放行为
    const zoom = d3.zoom()
        .scaleExtent([0.2, 3])
        .on('zoom', (event) => {
            currentTransform = event.transform;
            treeG.attr('transform', currentTransform);
        });
    
    treeSvg.call(zoom);
    
    // 创建树布局
    const treeLayout = d3.tree()
        .size([height - (isMobile ? 60 : 100), width - (isMobile ? 50 : 200)])
        .nodeSize([isMobile ? 80 : null, isMobile ? 80 : null]);
    
    // 创建层次结构
    const root = d3.hierarchy(familyData);
    const treeData = treeLayout(root);
    
    // 绘制连接线
    treeG.selectAll('.link')
        .data(treeData.links())
        .enter()
        .append('path')
        .attr('class', 'link')
        .attr('d', d3.linkHorizontal()
            .x(d => d.y)
            .y(d => d.x)
        );
    
    // 创建节点组
    const nodes = treeG.selectAll('.node')
        .data(treeData.descendants())
        .enter()
        .append('g')
        .attr('class', 'node')
        .attr('transform', d => `translate(${d.y},${d.x})`)
        .on('click', (event, d) => showMemberDetails(d.data));
    
    // 绘制节点圆形
    nodes.append('circle')
        .attr('r', isMobile ? 15 : 20);
    
    // 添加性别图标
    nodes.append('text')
        .attr('dy', '0.35em')
        .attr('text-anchor', 'middle')
        .style('font-size', isMobile ? '14px' : '16px')
        .text(d => d.data.gender === 'male' ? '♂' : '♀')
        .attr('fill', d => d.data.gender === 'male' ? '#3182ce' : '#d53f8c');
    
    // 添加姓名
    nodes.append('text')
        .attr('dy', isMobile ? '2.2em' : '2.5em')
        .attr('text-anchor', 'middle')
        .style('font-size', isMobile ? '11px' : '14px')
        .text(d => d.data.name);
    
    // 初始缩放和位置
    const initialX = width / 2 - root.y;
    const initialY = height / 2 - root.x;
    treeSvg.call(zoom.transform, d3.zoomIdentity.translate(initialX, initialY));
}

// 显示成员详情
function showMemberDetails(member) {
    // 更新UI
    document.getElementById('name').textContent = member.name;
    document.getElementById('avatar').textContent = member.name.charAt(0);
    
    // 基本信息
    const gender = member.gender === 'male' ? '男' : '女';
    const birth = member.birth ? `生于 ${member.birth}` : '';
    const death = member.death ? `，卒于 ${member.death}` : '';
    const spouse = member.spouse ? ` | 配偶: ${member.spouse}` : '';
    
    document.getElementById('basic-info').textContent = 
        `${gender} | ${birth}${death}${spouse}`;
    
    // 生平简介
    document.getElementById('bio').textContent = member.bio || '暂无详细介绍';
    
    // 家庭关系
    const relationships = document.getElementById('relationships');
    relationships.innerHTML = '';
    
    if (member.parent) {
        const parent = document.createElement('div');
        parent.className = 'relationship';
        parent.textContent = `父亲: ${member.parent.name}`;
        relationships.appendChild(parent);
    }
    
    if (member.spouse) {
        const spouse = document.createElement('div');
        spouse.className = 'relationship';
        spouse.textContent = `配偶: ${member.spouse}`;
        relationships.appendChild(spouse);
    }
    
    if (member.children && member.children.length > 0) {
        const children = document.createElement('div');
        children.className = 'relationship';
        children.textContent = `子女: ${member.children.length}位`;
        relationships.appendChild(children);
    }
    
    // 移动端优化关系显示
    const isMobile = window.matchMedia("(max-width: 576px)").matches;
    if (isMobile) {
        relationships.style.flexDirection = 'column';
    }
    
    // 切换视图
    defaultViewElement.style.display = 'none';
    memberDetailsElement.style.display = 'block';
    
    // 滚动到详情面板（移动端）
    if (isMobile) {
        memberDetailsElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

// 缩放功能
function zoomIn() {
    treeSvg.transition().call(treeSvg.__zoom.scaleBy, 1.3);
}

function zoomOut() {
    treeSvg.transition().call(treeSvg.__zoom.scaleBy, 0.7);
}

function resetZoom() {
    const container = document.getElementById('tree');
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    treeSvg.transition()
        .call(treeSvg.__zoom.transform, d3.zoomIdentity
            .translate(width / 2, height / 2)
            .scale(1));
}

// 搜索功能
function searchMember() {
    const searchTerm = this.value.toLowerCase();
    
    if (searchTerm === '') {
        d3.selectAll('.node').style('opacity', 1);
        return;
    }
    
    d3.selectAll('.node')
        .style('opacity', function(d) {
            return d.data.name.toLowerCase().includes(searchTerm) ? 1 : 0.3;
        });
}

// 显示/隐藏加载状态
function showLoading(show) {
    loadingElement.style.display = show ? 'flex' : 'none';
}

// 显示错误信息
function showError(message) {
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    errorElement.textContent = message;
    
    const container = document.querySelector('.container');
    container.insertBefore(errorElement, container.firstChild);
    
    setTimeout(() => {
        errorElement.remove();
    }, 5000);
}