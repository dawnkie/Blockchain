package v3

import (
	_ "github.com/go-sql-driver/mysql"
	"github.com/jmoiron/sqlx"
)

var DB *sqlx.DB

func init() {
	database, err := sqlx.Open("mysql", "root:My)4@0!1@tcp(localhost:3306)/blockchain")
	HandleError(err, "Utils.go:init")
	DB = database
}

func QueryTailBlocks(limit int) (bs []Block) {
	height, isExit := GetTailHeight()
	if isExit {
		const ql = "select * from blocks where height > ? and height <= ?"
		HandleError(DB.Select(&bs, ql, height-uint64(limit), height), "QueryTailBlocks")
	}
	return bs
}

func QueryByHeight(height uint64) (b *Block) {
	var blocks []Block
	const ql = "select * from blocks where height = ?"
	HandleError(DB.Select(&blocks, ql, height), "QueryByHeight")
	if len(blocks) == 0 {
		return nil
	}
	return &blocks[0]
}

func InsertBlock(b *Block) {
	const ql = "insert into blocks(`height`, `version`,`bits`,`timestamp`,prev_block_hash,merkel_root,`nonce`,`data`,`hash`) values (?,?,?,?,?,?,?,?,?)"
	_, err := DB.Exec(ql, b.TOSlice()...)
	HandleError(err, "InsertBlock")
}

func GetTailHeight() (height uint64, isExit bool) {
	var heights []uint64
	const ql = "select max(height) from blocks"
	HandleError(DB.Select(&heights, ql), "GetTailHeight")
	if len(heights) == 0 {
		return 0, false
	}
	return heights[0], true
}
