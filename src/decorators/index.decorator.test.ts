import { mongODMetaDataStorage } from '..'
import { MongODMIndex } from './index.decorator'
import { MongODMConnection } from '../connection/connection'
import { MongODMEntity } from '../entity/entity'

const databaseName = 'indexDecorator'

describe('MongODMIndex decorator', () => {
	it('should add index meta to mongODMetaDataStorage', () => {
		class MongODMIndexClass extends MongODMEntity {
			@MongODMIndex({
				unique: true,
			})
			hello: string

			@MongODMIndex({
				unique: false,
			})
			world: string

			constructor() {
				super()
				this.hello = 'world'
				this.world = 'hello'
			}
		}

		const classIndexMetas = mongODMetaDataStorage().mongODMIndexMetas
			.mongodmindexclass
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
		class UniqueIndex extends MongODMEntity {
			@MongODMIndex({
				unique: true,
			})
			id: string

			constructor() {
				super()
				this.id = 'hello'
			}
		}

		const connexion = await new MongODMConnection({
			databaseName,
		}).connect({
			clean: true,
		})

		// No error for the first object saved with id = hello
		await connexion.collections.uniqueindex.insertOne(new UniqueIndex())

		let hasError = false

		try {
			await connexion.collections.uniqueindex.insertOne(new UniqueIndex())
		} catch (error) {
			hasError = true
		}

		expect(hasError).toBe(true)
	})
})
