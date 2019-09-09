import { mongORMetaDataStorage } from '..'
import { generateCollectionName, MongORMConnection } from '../connection'
import { MongORMIndex } from './index.decorator'

const databaseName = 'indexDecorator'

describe('MongORMIndex decorator', () => {
	it('should add index meta to mongORMetaDataStorage', () => {
		class MongORMIndexClass {
			@MongORMIndex({
				unique: true,
			})
			hello: string

			@MongORMIndex({
				unique: false,
			})
			world: string

			constructor() {
				this.hello = 'world'
				this.world = 'hello'
			}
		}

		const classIndexMetas = mongORMetaDataStorage().mongORMIndexMetas[
			generateCollectionName(new MongORMIndexClass())
		]
		expect(classIndexMetas.length).toEqual(2)

		expect(classIndexMetas[0]).toStrictEqual({
			key: 'hello',
			unique: true,
		})

		expect(classIndexMetas[1]).toStrictEqual({
			key: 'world',
			unique: false,
		})
	})

	it('should create a unique index', async () => {
		class UniqueIndex {
			@MongORMIndex({
				unique: true,
			})
			id: string

			constructor() {
				this.id = 'hello'
			}
		}

		const connexion = await new MongORMConnection({
			databaseName,
		}).connect({
			clean: true,
		})

		// No error for the first object saved with id = hello
		const collectionName = generateCollectionName(new UniqueIndex())
		await connexion.collections[collectionName].insertOne(new UniqueIndex())

		let hasError = false

		try {
			await connexion.collections[collectionName].insertOne(new UniqueIndex())
		} catch (error) {
			hasError = true
		}

		expect(hasError).toBe(true)
	})
})
