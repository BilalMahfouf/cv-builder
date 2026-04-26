import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreateCvs1710000000003 implements MigrationInterface {
  name = 'CreateCvs1710000000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'cvs',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'slug',
            type: 'varchar',
            length: '10',
            isNullable: false,
          },
          {
            name: 'title',
            type: 'varchar',
            length: '150',
            isNullable: false,
            default: "'Untitled CV'",
          },
          {
            name: 'created_on_utc',
            type: 'timestamptz',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updated_on_utc',
            type: 'timestamptz',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'cvs',
      new TableForeignKey({
        name: 'fk_cvs_users_user_id',
        columnNames: ['user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createIndex(
      'cvs',
      new TableIndex({
        name: 'ix_cvs_user_id',
        columnNames: ['user_id'],
      }),
    );

    await queryRunner.createIndex(
      'cvs',
      new TableIndex({
        name: 'ix_cvs_slug',
        columnNames: ['slug'],
        isUnique: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('cvs', 'ix_cvs_slug');
    await queryRunner.dropIndex('cvs', 'ix_cvs_user_id');
    await queryRunner.dropForeignKey('cvs', 'fk_cvs_users_user_id');
    await queryRunner.dropTable('cvs');
  }
}
