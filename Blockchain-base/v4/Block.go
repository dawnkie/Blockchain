package v4

import (
	"bytes"
	"crypto/sha256"
	"database/sql"
	"fmt"
	"math"
	"math/big"
	"time"
)

// Block 1- 结构体：区块
type Block struct {
	// 区块高度(ID)
	Height uint64 `db:"height"`
	// 版本
	Version uint64 `db:"version"`
	// 哈希最少要有几位0(难度值)
	Bits uint64 `db:"bits"`
	// 时间戳
	Timestamp uint64 `db:"timestamp"`
	// 前区块头哈希值 ← hash(Version,Bits,Timestamp,PrevBlockHash,MerkelRoot,Nonce)
	PrevBlockHash []byte `db:"prev_block_hash"`
	// 默克尔根：此处用区块体哈希简单代替
	MerkelRoot []byte `db:"merkel_root"`
	// 随机值
	Nonce uint64 `db:"nonce"`
	// 交易信息(区块体)
	Data []byte `db:"data"`
	// 当前区块头哈希值：注意，实际比特币区块链不存在该字段
	Hash []byte `db:"hash"`
}

const targetBits = 1
const version = 1

// NewBlock 2- 函数：创建区块
func NewBlock(prevBlockHash []byte, data string) *Block {
	block := new(Block)
	block.Version = version
	block.Bits = targetBits
	block.Timestamp = uint64(time.Now().Unix())
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
		UintToBytes(b.Timestamp),
		b.PrevBlockHash,
		b.MerkelRoot,
		UintToBytes(b.Nonce),
	}
	// bytes.Join(二维切片，分隔符)：用分隔符将切片组拼接成切片
	data := bytes.Join(packed, []byte{})
	hash := sha256.Sum256(data)
	return hash[:]
}

// 2.2 函数：默克尔根，此处用区块体哈希简单代替
func (b *Block) getMerkelRoot() []byte {
	hash := sha256.Sum256(b.Data)
	return hash[:]
}

// 2.3 函数：破解哈希谜题(POW，工作量证明)
func (b *Block) puzzle() (nonce uint64, headerHash []byte) {
	fmt.Print("\r\nStart Mining...")
	target := big.NewInt(1)
	target.Lsh(target, uint(256-targetBits))
	packedRaw := [][]byte{
		UintToBytes(b.Version),
		UintToBytes(b.Bits),
		UintToBytes(b.Timestamp),
		b.PrevBlockHash,
		b.MerkelRoot,
	}
	pBig := big.NewInt(1)
	for b.Nonce < math.MaxUint64 {
		// bytes.Join(二维切片，分隔符)：用分隔符将切片组拼接成切片
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

func (b *Block) TOSlice() []interface{} {
	// "Block(`version`,`bits`,`timestamp`,prev_block_hash,merkel_root,`nonce`,`data`,`hash`)"
	var arr [9]interface{}
	arr[0] = sql.NullInt64{}
	arr[1] = b.Version
	arr[2] = b.Bits
	arr[3] = b.Timestamp
	arr[4] = b.PrevBlockHash
	arr[5] = b.MerkelRoot
	arr[6] = b.Nonce
	arr[7] = b.Data
	arr[8] = b.Hash
	return arr[:]
}

func (b *Block) String() string {
	tm := time.Unix(int64(b.Timestamp), 0).Format("2006/01/02 15:04:05 MST")
	return fmt.Sprintf("(Height:%v, Version:%v, Difficulty: %-2v, Time: %v, PrevBlockHash: %#-66x, Hash: %#-66x, MerkelRoot: %#-66x, Nonce: %-8v, Data: %-20v)", b.Height, b.Version, b.Bits, tm, b.PrevBlockHash, b.Hash, b.MerkelRoot, b.Nonce, string(b.Data))
}
