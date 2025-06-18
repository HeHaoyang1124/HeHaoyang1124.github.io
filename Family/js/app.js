// 外部数据源URL
const DATA_SOURCE = './data/family-data.json';

// 全局变量
let familyData = null;
let currentTransform = d3.zoomIdentity;
let treeSvg, treeG;
let isEditMode = false;
let selectedNode = null;

// DOM元素
const loadingOverlay = document.getElementById('loading-overlay');
const reloadBtn = document.getElementById('reload-btn');
const searchInput = document.getElementById('search-input');
const memberCountEl = document.getElementById('member-count');
const generationCountEl = document.getElementById('generation-count');
const errorMessageEl = document.getElementById('error-message');
const editBtn = document.getElementById('edit-btn');

// 加载家族数据
async function loadFamilyData() {
    try {
        showLoading(true);
        hideError();

        // fetch请求
        const response = await fetch(DATA_SOURCE);
        if (!response.ok) throw new Error('Network response was not ok');
        familyData = await response.json();

        // 预处理数据
        let maxDepth = 0;
        let memberCount = 0;

        function processNode(node, depth = 0) {
            node.depth = depth;
            memberCount++;
            maxDepth = Math.max(maxDepth, depth);

            if (node.children) {
                node.children.forEach(child => {
                    child.parent = node; // 添加父节点引用
                    processNode(child, depth + 1);
                });
            }
        }

        processNode(familyData);

        // 更新统计数据
        updateStatistics(memberCount, maxDepth + 1);

        // 初始化树状图
        initTree();

    } catch (error) {
        console.error('加载数据失败:', error);
        showError('加载家族数据失败，请稍后重试: ' + error.message);
    } finally {
        showLoading(false);
    }
}

// 显示/隐藏加载状态
function showLoading(show) {
    loadingOverlay.style.display = show ? 'flex' : 'none';
}

// 显示错误信息
function showError(message) {
    errorMessageEl.textContent = message;
    errorMessageEl.style.display = 'block';
}

// 隐藏错误信息
function hideError() {
    errorMessageEl.style.display = 'none';
}

// 更新成员和代数统计
function updateStatistics(memberCount, generations) {
    memberCountEl.textContent = memberCount;
    generationCountEl.textContent = generations;
}

// 初始化树状图
function initTree() {
    const svg = d3.select("#tree-svg");
    const width = svg.node().getBoundingClientRect().width;
    const height = svg.node().getBoundingClientRect().height;

    // 保存引用
    treeSvg = svg;

    // 清除现有内容
    svg.selectAll("*").remove();

    // 创建缩放容器
    treeG = svg.append("g");

    // 设置缩放行为
    const zoom = d3.zoom()
        .scaleExtent([0.2, 3])
        .on("zoom", (event) => {
            currentTransform = event.transform;
            treeG.attr("transform", currentTransform);
        });

    svg.call(zoom);

    // 创建树布局
    const treeLayout = d3.tree()
        .size([height - 100, width - 200])
        .separation((a, b) => a.parent === b.parent ? 1 : 1.5);

    // 创建层次结构
    const root = d3.hierarchy(familyData);

    // 计算节点位置
    treeLayout(root);

    // 绘制连接线
    const links = treeG.selectAll(".link")
        .data(root.links())
        .enter()
        .append("path")
        .attr("class", "link")
        .attr("d", d3.linkHorizontal()
            .x(d => d.y)
            .y(d => d.x)
        );

    // 创建节点组
    const nodes = treeG.selectAll(".node")
        .data(root.descendants())
        .enter()
        .append("g")
        .attr("class", "node")
        .attr("transform", d => `translate(${d.y},${d.x})`)
        .on("click", (event, d) => {
            if (isEditMode) {
                // 编辑模式下的点击处理
                handleEditClick(event, d);
            } else {
                // 查看模式下的点击处理
                handleViewClick(event, d);
            }
        });

    // 绘制节点圆形
    nodes.append("circle")
        .attr("class", "node-circle")
        .attr("r", 25);

    // 添加头像占位符
    nodes.append("text")
        .attr("class", "node-icon")
        .attr("text-anchor", "middle")
        .attr("dy", "0.35em")
        .attr("fill", d => d.data.gender === "male" ? "#3182ce" : "#d53f8c")
        .text(d => d.data.gender === "male" ? "♂" : "♀")
        .style("font-size", "20px");

    // 添加姓名
    nodes.append("text")
        .attr("class", "node-text")
        .attr("dy", "3em")
        .text(d => d.data.name);

    // 添加缩放控制
    d3.select("#zoom-in").on("click", () => {
        svg.transition().call(zoom.scaleBy, 1.3);
    });

    d3.select("#zoom-out").on("click", () => {
        svg.transition().call(zoom.scaleBy, 0.7);
    });

    d3.select("#reset-view").on("click", () => {
        const initialX = width / 2 - root.y;
        const initialY = height / 2 - root.x;
        svg.transition().call(zoom.transform, d3.zoomIdentity.translate(initialX, initialY));
    });

    // 初始位置居中
    const initialX = width / 2 - root.y;
    const initialY = height / 2 - root.x;
    svg.call(zoom.transform, d3.zoomIdentity.translate(initialX, initialY));
}

// 处理查看模式下的点击
function handleViewClick(event, d) {
    // 移除所有高亮
    d3.selectAll(".node").classed("highlighted", false);
    // 高亮当前节点
    d3.select(event.currentTarget).classed("highlighted", true);
    // 显示成员详情
    showMemberDetails(d.data);
    // 高亮关系路径
    highlightRelationships(d.data.id);
}

// 处理编辑模式下的点击
function handleEditClick(event, d) {
    selectedNode = d;
    // 高亮选中的节点
    d3.selectAll(".node").classed("highlighted", false);
    d3.select(event.currentTarget).classed("highlighted", true);
    // 显示编辑菜单
    showEditMenu(d.data);
}

// 显示成员详情
function showMemberDetails(member) {
    // 更新UI
    document.getElementById("member-name").textContent = member.name;
    document.getElementById("avatar-initial").textContent = member.name.charAt(0);

    // 基本资料
    const genderText = member.gender === "male" ? "男" : "女";
    const birthText = member.birth ? `生于 ${member.birth}` : "";
    const deathText = member.death ? `，卒于 ${member.death}` : "";
    const ageText = member.death ? "" : `（${calculateAge(member.birth)}岁）`;

    document.getElementById("basic-info").textContent =
        `${genderText} | ${birthText}${deathText}${ageText}${member.spouse ? ` | 配偶: ${member.spouse}` : ''}`;

    // 生平简介
    document.getElementById("bio").textContent = member.bio || "暂无详细介绍";

    // 家庭关系
    const relationshipsContainer = document.getElementById("relationships");
    relationshipsContainer.innerHTML = "";

    if (member.parent) {
        const chip = document.createElement("div");
        chip.className = "relation-chip";
        chip.innerHTML = `<i class="fas fa-user"></i> 父亲: ${member.parent.name}`;
        chip.addEventListener("click", () => {
            // 在实际应用中，应该找到并高亮父节点
            alert(`将高亮显示 ${member.parent.name} 的节点`);
        });
        relationshipsContainer.appendChild(chip);
    }

    if (member.spouse) {
        const chip = document.createElement("div");
        chip.className = "relation-chip";
        chip.innerHTML = `<i class="fas fa-heart"></i> 配偶: ${member.spouse}`;
        relationshipsContainer.appendChild(chip);
    }

    if (member.children && member.children.length > 0) {
        const chip = document.createElement("div");
        chip.className = "relation-chip";
        chip.innerHTML = `<i class="fas fa-child"></i> 子女: ${member.children.length}位`;
        chip.addEventListener("click", () => {
            // 在实际应用中，应该找到并高亮所有子节点
            alert(`将高亮显示 ${member.children.length} 位子女的节点`);
        });
        relationshipsContainer.appendChild(chip);
    }

    // 显示详情面板
    document.querySelector(".default-message").style.display = "none";
    document.querySelector(".member-details").style.display = "flex";
}

// 高亮关系路径
function highlightRelationships(memberId) {
    // 重置所有高亮
    d3.selectAll(".link").classed("highlight-link", false);
    d3.selectAll(".node").classed("highlight-node", false);

    // 在实际应用中，应该找到与当前成员相关的所有节点和连接线
    // 这里简化为高亮父节点和子节点
    d3.selectAll(".node")
        .filter(d => d.data.id === memberId ||
            (d.data.parent && d.data.parent.id === memberId) ||
            (d.data.children && d.data.children.some(c => c.id === memberId)))
        .classed("highlight-node", true);

    d3.selectAll(".link")
        .filter(d => (d.source.data.id === memberId ||
            d.target.data.id === memberId))
        .classed("highlight-link", true);
}

// 显示编辑菜单
function showEditMenu(member) {
    // 在实际应用中，这里应该显示一个编辑表单
    alert(`编辑模式: 准备编辑 ${member.name} 的信息`);
}

// 计算年龄
function calculateAge(birthDate) {
    if (!birthDate) return "";
    const birthYear = parseInt(birthDate.substring(0, 4));
    const currentYear = new Date().getFullYear();
    return currentYear - birthYear;
}

// 设置搜索功能
function setupSearch() {
    searchInput.addEventListener('input', function () {
        const searchTerm = this.value.toLowerCase().trim();

        // 清除之前的高亮
        d3.selectAll(".node").classed("search-match", false);

        if (searchTerm === '') {
            // 如果搜索框为空，恢复所有节点的显示
            d3.selectAll(".node, .link").style("opacity", 1);
            return;
        }

        // 搜索并高亮匹配节点
        d3.selectAll(".node")
            .filter(d => d.data.name.toLowerCase().includes(searchTerm))
            .classed("search-match", true)
            .each(function (d) {
                // 自动平移视图到匹配节点
                const [x, y] = [d.y, d.x];
                const svg = d3.select("#tree-svg");
                const width = svg.node().getBoundingClientRect().width;
                const height = svg.node().getBoundingClientRect().height;

                svg.transition()
                    .call(treeSvg.__zoom.transform, d3.zoomIdentity.translate(
                        width / 2 - currentTransform.k * y,
                        height / 2 - currentTransform.k * x
                    ));
            });

        // 淡化不匹配的节点
        d3.selectAll(".node").style("opacity", function (d) {
            return d.data.name.toLowerCase().includes(searchTerm) ? 1 : 0.3;
        });

        d3.selectAll(".link").style("opacity", function (d) {
            return (d.source.data.name.toLowerCase().includes(searchTerm) ||
                d.target.data.name.toLowerCase().includes(searchTerm)) ? 1 : 0.3;
        });
    });
}

// 切换编辑模式
function toggleEditMode() {
    isEditMode = !isEditMode;
    editBtn.innerHTML = isEditMode
        ? '<i class="fas fa-times"></i> 退出编辑'
        : '<i class="fas fa-edit"></i> 编辑模式';
    editBtn.style.backgroundColor = isEditMode ? '#e53e3e' : '#38a169';

    if (isEditMode) {
        alert('编辑模式已激活，点击节点可进行编辑');
    } else {
        selectedNode = null;
        d3.selectAll(".node").classed("highlighted", false);
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    // 加载初始数据
    loadFamilyData();

    // 重新加载按钮事件
    reloadBtn.addEventListener('click', loadFamilyData);

    // 设置搜索功能
    setupSearch();
});