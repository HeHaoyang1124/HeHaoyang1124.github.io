1. 校准正方向（白色为底）

2. 底面cross 
   对于每一个棱块情况如下：
   
   - 已还原$(x,y,z)= (1, 2, 0)$ whiteDirect = 'down'
   
   - 底面其他位置 $y = 2\to$移动到顶层
   
   - 顶层 $y = 0\to$ $(x, y, z) = (1, 0, 0)$
     
     - 白色指向侧面 whiteDirect = 'face'
     
     - 白色指向顶面 whiteDirect = 'up'
   
   - 中间位置 $(y=1)\to$移动到顶层
     
     - $(x, z) = (0, 0)$
     
     - $(x,z)=(0,2)$
     
     - $(x,z)= (2,0)$
     
     - $(x,z)=(2,2)$

3. 底层corner
   对于每一个角块块情况如下：
   
   - 已还原$(x, y, z) = (2, 2, 0)$ whiteDirect = 'down'
   
   - 底层其他位置$y=2\to$移动到顶层
   
   - 顶层 $y=0\to(x, y, z) = (2, 0, 0)$
     
     - 白色指向正面 whiteDirect = 'face'
     
     - 白色指向侧面 whiteDirect = 'right'
     
     - 白色指向顶面 whiteDirect = 'up'

4. Middle Layer
   公式：
   对于每一个棱块情况如下
   
   - 已还原$(x, y, z) = (2, 1, 0) $ TargetColor_Direct = 'face'
   
   - 中间层其他位置$y = 1\to$移动到顶层正面
     
     - $(x, z) = (0, 0)\to$ y' + 公式1 + yU
     
     - $(x, z) = (2, 0)\to$ 公式1 + UU
     
     - $(x, z) = (2, 2)\to$ y + 公式1 + y'U'
     
     - $(x, z) = (0, 2)\to$ yy + 公式1 + yy
   
   - 顶层位置$y = 0\to$移动到正面
     
     - $(x, z) = (1, 2)\to$ UU
     
     - $(x, z) = (2, 1)\to$ U
     
     - $(x, z) = (0, 1)\to$ U'
   
   - TargetColor_Direct = 'face' $\to$ 公式1
     
     TargetColor_direct = 'up' $\to$ 公式2
     
     

5. cross

6. prisms

7. oll

8. pll