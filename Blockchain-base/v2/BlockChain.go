package v2

import (
	"bytes"
	"fmt"
	"math/big"
)

// BlockChain 3- 结构体：区块链
type BlockChain struct {
	Blocks []*Block
}

// NewBlockChain 4- 函数：创建区块链
func NewBlockChain() *BlockChain {
	block := NewBlock([]byte{}, "Genus Block")
	fmt.Print("创世块\r\n")
	var blockChain BlockChain
	blockChain.Blocks = append(blockChain.Blocks, block)
	return &blockChain
}

// AddBlock 5- 函数：添加区块
func (bc *BlockChain) AddBlock(data string) {
	pb := bc.Blocks[len(bc.Blocks)-1]
	b := NewBlock(pb.getHash(), data)
	if bc.IsValid(b) {
		fmt.Print("哈希校验通过：true\r\n")
		bc.Blocks = append(bc.Blocks, b)
	} else {
		panic("[ERROR] Illegal Block!")
	}
}

// IsValid 5.1 函数：区块哈希验证
func (bc *BlockChain) IsValid(b *Block) bool {
	hashInt := big.NewInt(1).SetBytes(b.getHash()[:])
	target := big.NewInt(1)
	target.Lsh(target, uint(256-targetBits))
	return hashInt.Cmp(target) == -1
}

func (bc *BlockChain) String() (str string) {
	for _, value := range bc.Blocks {
		str += "\r\n" + value.String() + "\r\n" + string(bytes.Repeat([]byte("\t"), 25)) + "↗"
	}
	return str
}
