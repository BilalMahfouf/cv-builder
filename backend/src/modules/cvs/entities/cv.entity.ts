import {
  Column,
  Entity,
  Index,
  OneToMany,
  ManyToOne,
  JoinColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Entity as DomainEntity } from '../../../common/domain/entity';
import { UserEntity } from '../../users/entities/user.entity';
import { CvSectionEntity } from '../../sections/entities/cv-section.entity';

@Entity('cvs')
@Index('ix_cvs_user_id', ['userId'])
@Index('ix_cvs_slug', ['slug'], { unique: true })
export class CvEntity extends DomainEntity {
  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ name: 'slug', type: 'varchar', length: 10 })
  slug!: string;

  @Column({
    name: 'title',
    type: 'varchar',
    length: 150,
    default: 'Untitled CV',
  })
  title!: string;

  @UpdateDateColumn({ name: 'updated_on_utc', type: 'timestamptz' })
  updatedOnUtc!: Date;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: UserEntity;

  @OneToMany(() => CvSectionEntity, (section) => section.cv, { cascade: true })
  sections!: CvSectionEntity[];
}
