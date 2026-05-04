import { Handle, Position, NodeResizer, useReactFlow } from '@xyflow/react';

const handleStyle = {
  opacity: 0, 
  width: "8px",
  height: "8px",
  background: "var(--theme-color)",
  border: "1px solid #ffffff",
  minWidth: "8px",
  minHeight: "8px",
  zIndex: 1000
};

export default function RelationshipNode({ id, data, selected }) {
  const { setNodes } = useReactFlow();

  return (
    <div className="relationship-node anim-node-entrance" style={{ position: 'relative', width: '100%', height: '100%' }}>
      <NodeResizer
        color="#3b82f6"
        isVisible={selected}
        minWidth={40}
        minHeight={40}
        handleStyle={{ 
          width: 10, 
          height: 10, 
          borderRadius: '2px', 
          background: '#ffffff', 
          border: `2px solid #3b82f6`, 
          zIndex: 1001,
          boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
        }}
        lineStyle={{ border: `1px solid #3b82f6`, opacity: 1 }}
        onResizeEnd={(evt, params) => {
          setNodes((nds) => nds.map((n) => {
            if (n.id === id) {
              return {
                ...n,
                style: { ...n.style, width: params.width, height: params.height }
              };
            }
            return n;
          }));
        }}
      />
      <Handle id="left" type="target" position={Position.Left} style={handleStyle} />
      <div style={{ 
        position: 'relative', 
        width: '100%', 
        height: '100%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center'
      }}>
        {/* Diamond shape using rotation */}
        <div style={{
          position: 'absolute',
          inset: '10%',
          background: data.fillColor || "#ffffff",
          border: `${selected ? 2 : (data.strokeWidth || 1.5)}px solid ${selected ? "var(--theme-color)" : (data.strokeColor || "#000000")}`,
          transform: 'rotate(45deg)',
          boxShadow: 'var(--node-shadow)'
        }} />
        <div style={{ position: 'relative', zIndex: 1, color: data.color || "#000000", fontSize: '12px', fontWeight: 'bold', textAlign: 'center', padding: '0 15px' }}>{data.label}</div>
      </div>
      <Handle id="right" type="source" position={Position.Right} style={handleStyle} />
    </div>
  );
}
