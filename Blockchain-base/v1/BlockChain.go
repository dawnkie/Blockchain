package v1

import "bytes"

// BlockChain 3- 结构体：区块链
type BlockChain struct {
	Blocks []*Block
}



// NewBlockChain 4- 函数：创建区块链
func NewBlockChain() *BlockChain {
	block := NewBlock([]byte{}, "Genus Block")
	var blockChain BlockChain
	blockChain.Blocks = append(blockChain.Blocks, block)
	return &blockChain
}

// AddBlock 5- 函数：添加区块
func (bc *BlockChain) AddBlock(data string) {
	pb := bc.Blocks[len(bc.Blocks)-1]
	b := NewBlock(pb.getHash(), data)
	bc.Blocks = append(bc.Blocks, b)
}

func (bc *BlockChain) String() (str string) {
	for _, value := range bc.Blocks {
		str += "\r\n" + value.String() + "\r\n" + string(bytes.Repeat([]byte("\t"),25))+"↗"
	}
	return str
}
