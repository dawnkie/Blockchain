package v2

import (
	"bytes"
	"crypto/sha256"
	"fmt"
	"math"
	"math/big"
	"time"
)

// Block 1- 结构体：区块
type Block struct {
	// 版本
	Version uint64
	// 哈希最少要有几位0(难度值)
	Bits uint64
	// 时间戳
	TimeStamp uint64
	// 前区块头哈希值 ← hash(Version,Bits,Timestamp,PrevBlockHash,MerkelRoot,Nonce)
	PrevBlockHash []byte
	// 默克尔根：此处用区块体哈希简单代替
	MerkelRoot []byte
	// 随机值
	Nonce uint64
	// 交易信息(区块体)
	Data []byte
	// 当前区块头哈希值：注意，实际比特币区块链不存在该字段
	Hash []byte
}

const targetBits = 20

// NewBlock 2- 函数：创建区块
func NewBlock(prevBlockHash []byte, data string) *Block {
	block := new(Block)
	block.Version = 1
	block.Bits = targetBits
	block.TimeStamp = uint64(time.Now().Unix())
	block.PrevBlockHash = prevBlockHash
	block.Data = []byte(data)
	block.MerkelRoot = block.getMerkelRoot()
	block.Nonce, block.Hash = block.puzzle()
	return block
}

// 2.1 函数：计算当前区块头的哈希值
func (b *Block) getHash() []byte {
	packed := [][]byte{
		UintToBytes(b.Version),
		UintToBytes(b.Bits),
		UintToBytes(b.TimeStamp),
		b.PrevBlockHash,
		b.MerkelRoot,
		UintToBytes(b.Nonce),
	}
	// bytes.Join(切片组，分隔符)：用分隔符将切片组拼接成切片
	data := bytes.Join(packed, []byte{})
	hash := sha256.Sum256(data)
	return hash[:]
}

// 2.2 函数：默克尔根，此处用区块体哈希简单代替
func (b *Block) getMerkelRoot() []byte {
	hash := sha256.Sum256(b.Data)
	return hash[:]
}

// 2.3 函数：破解哈希谜题(POW工作量证明)
func (b *Block) puzzle() (nonce uint64, headerHash []byte) {
	fmt.Print("Start Mining...")
	target := big.NewInt(1)
	target.Lsh(target, uint(256-targetBits))
	packedRaw := [][]byte{
		UintToBytes(b.Version),
		UintToBytes(b.Bits),
		UintToBytes(b.TimeStamp),
		b.PrevBlockHash,
		b.MerkelRoot,
	}
	pBig := big.NewInt(1)
	for b.Nonce < math.MaxUint64 {
		// bytes.Join(切片组，分隔符)：用分隔符将切片组拼接成切片
		packed := bytes.Join(append(packedRaw, UintToBytes(b.Nonce)), []byte{})
		puzzle := sha256.Sum256(packed)
		pBig.SetBytes(puzzle[:])
		if pBig.Cmp(target) == -1 {
			fmt.Printf("Found nocne: %10v, headerHash: %#x\r\n", b.Nonce, puzzle[:])
			return b.Nonce, puzzle[:]
		} else {
			b.Nonce++
		}
	}
	panic("[ERROR] Puzzle Failed! Found Nothing! ")
}

func (b *Block) String() string {
	tm := time.Unix(int64(b.TimeStamp), 0).Format("2006/01/02 15:04:05 MST")
	return fmt.Sprintf("(Version:%v, Difficulty: %-2v, Time: %v, PrevBlockHash: %#-66x, Hash: %#-66x, MerkelRoot: %#-66x, Nonce: %-8v, Data: %-20v)", b.Version, b.Bits, tm, b.PrevBlockHash, b.Hash, b.MerkelRoot, b.Nonce, b.Data)
}
