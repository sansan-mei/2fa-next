import { generateSnowflake } from "@/utils/totp";
import { DataConnection, Peer } from "peerjs";
import { useEffect, useMemo, useState } from "react";


type Data = string | number | object | boolean

export function useWebRtcConnection() {
  const [connection, setConnection] = useState<DataConnection | null>(null)
  const [peerId, setPeerId] = useState('')
  const [logs, setLogs] = useState<string[]>([])
  const [peer, setPeer] = useState<Peer | null>(null)
  const [data, setData] = useState<Data[]>([])

  const isConnected = useMemo(() => {
    return !!connection?.open
  }, [connection])

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  // 统一处理连接事件的函数
  const setupConnectionEvents = (conn: DataConnection) => {
    conn.on('open', () => {
      addLog('连接已建立');
      setConnection(conn);
    });

    conn.on('data', (data) => {
      if (data) {
        addLog(`收到数据: ${data}`);
        setData(prev => [...prev, data])
      }
    });

    conn.on('error', (err) => {
      addLog(`连接错误: ${err}`);
      setConnection(null);
    });

    conn.on('close', () => {
      addLog('连接已关闭');
      setConnection(null);
    });
  };

  useEffect(() => {
    const id = generateSnowflake()
    setPeerId(id)
    const peer = new Peer(id);
    setPeer(peer)

    peer.on('open', (id) => {
      addLog(`已连接到服务器，我的ID是: ${id}`)
    });

    peer.on('error', (err) => {
      addLog(`Peer错误: ${err.message}`)
    });

    peer.on('connection', (conn) => {
      addLog(`收到来自 ${conn.peer} 的连接`);
      setupConnectionEvents(conn);
    });

    return () => {
      addLog('清理连接')
      peer.destroy()
      connection?.close()
      setConnection(null)
    }
  }, [])

  const connectToPeer = (targetId: string) => {
    if (!targetId || !peer) return
    const conn = peer.connect(targetId.replace(/-/g, ''));
    addLog(`尝试连接到 ${targetId}`);
    setupConnectionEvents(conn);
  }

  const sendData = (data: Data) => {
    if (!connection) {
      addLog('发送失败: 没有活跃连接');
      return false;
    }

    if (!connection.open) {
      addLog('发送失败: 连接未打开');
      return false;
    }

    try {
      connection.send(data);
      addLog(`发送数据: ${data}`);
      return true;
    } catch (error) {
      addLog(`发送数据失败: ${error}`);
      return false;
    }
  }

  return {
    connection,
    peerId,
    logs,
    peer,
    connectToPeer,
    sendData,
    isConnected,
    data
  }
}
