// 全局变量
let familyData = null;
let treeSvg, treeG;

// 初始化应用
document.addEventListener('DOMContentLoaded', function() {
    // 加载数据
    loadFamilyData();
    
    // 搜索功能
    document.getElementById('search').addEventListener('input', searchMember);
});

// 加载家族数据
async function loadFamilyData() {
    try {
        showLoading(true);
        
        // 从外部JSON文件加载数据
        const response = await fetch('data/family-data.json');
        if (!response.ok) throw new Error('加载失败');
        
        familyData = await response.json();
        
        // 初始化树状图
        initTree();
        
    } catch (error) {
        console.error('加载数据失败:', error);
        alert('加载家族数据失败，请重试');
    } finally {
        showLoading(false);
    }
}

// 初始化竖向树状图
function initTree() {
    const container = document.getElementById('tree');
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    // 清除旧内容
    container.innerHTML = '';
    
    // 创建SVG
    treeSvg = d3.select('#tree')
        .append('svg')
        .attr('width', width)
        .attr('height', height);
    
    // 创建树布局 - 竖向
    const treeLayout = d3.tree()
        .size([width - 40, height - 80])  // 留出边距
        .nodeSize([80, 150]);  // 节点间距
    
    // 创建层次结构
    const root = d3.hierarchy(familyData);
    const treeData = treeLayout(root);
    
    // 创建连接线 - 竖向
    treeSvg.selectAll('.link')
        .data(treeData.links())
        .enter()
        .append('path')
        .attr('class', 'link')
        .attr('d', d3.linkVertical()
            .x(d => d.x)
            .y(d => d.y)
        );
    
    // 创建节点组
    const nodes = treeSvg.selectAll('.node')
        .data(treeData.descendants())
        .enter()
        .append('g')
        .attr('class', 'node')
        .attr('transform', d => `translate(${d.x},${d.y})`)
        .on('click', (event, d) => showMemberDetails(d.data));
    
    // 绘制节点圆形
    nodes.append('circle')
        .attr('r', 14);
    
    // 添加姓名
    nodes.append('text')
        .attr('dy', 25)
        .attr('text-anchor', 'middle')
        .text(d => d.data.name)
        .style('font-size', '13px');
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
    document.getElementById('bio').textContent = member.bio || '暂无介绍';
    
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
    
    // 显示详情面板
    document.querySelector('.default-view').style.display = 'none';
    document.getElementById('member-details').style.display = 'block';
    
    // 滚动到详情
    document.querySelector('.info-panel').scrollIntoView({ behavior: 'smooth' });
}

// 搜索功能
function searchMember() {
    const searchTerm = this.value.toLowerCase();
    
    if (!searchTerm) {
        d3.selectAll('.node').style('opacity', 1);
        return;
    }
    
    d3.selectAll('.node')
        .style('opacity', d => 
            d.data.name.toLowerCase().includes(searchTerm) ? 1 : 0.3
        );
}

// 显示/隐藏加载状态
function showLoading(show) {
    document.getElementById('loading').style.display = show ? 'flex' : 'none';
}