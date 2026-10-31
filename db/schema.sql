-- جداول مركز المساعدة (MySQL 8 / MariaDB 10.4+)

CREATE TABLE IF NOT EXISTS categories (
  id          VARCHAR(100) NOT NULL PRIMARY KEY,
  icon        VARCHAR(20)  NOT NULL,
  sort_order  INT          NOT NULL DEFAULT 1,
  nav         TINYINT(1)   NOT NULL DEFAULT 0,
  title_ar    VARCHAR(255) NOT NULL,
  title_en    VARCHAR(255) NOT NULL DEFAULT '',
  desc_ar     TEXT         NOT NULL,
  desc_en     TEXT         NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- تغيير رابط القسم ينتقل تلقائيًا لمقالاته، وحذف قسم فيه مقالات مرفوض.
CREATE TABLE IF NOT EXISTS articles (
  id           VARCHAR(100) NOT NULL PRIMARY KEY,
  category_id  VARCHAR(100) NOT NULL,
  sort_order   INT          NOT NULL DEFAULT 1,
  published    TINYINT(1)   NOT NULL DEFAULT 1,
  updated_at   DATETIME(3)  NOT NULL,
  title_ar     VARCHAR(255) NOT NULL,
  title_en     VARCHAR(255) NOT NULL DEFAULT '',
  body_ar      MEDIUMTEXT   NOT NULL,
  body_en      MEDIUMTEXT   NOT NULL,
  KEY idx_articles_category (category_id, sort_order),
  CONSTRAINT fk_articles_category FOREIGN KEY (category_id)
    REFERENCES categories (id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- صف واحد فقط (id = 1)
CREATE TABLE IF NOT EXISTS settings (
  id           TINYINT      NOT NULL PRIMARY KEY,
  site_name    VARCHAR(255) NOT NULL,
  hero_ar      VARCHAR(500) NOT NULL DEFAULT '',
  hero_en      VARCHAR(500) NOT NULL DEFAULT '',
  footer_ar    VARCHAR(500) NOT NULL DEFAULT '',
  footer_en    VARCHAR(500) NOT NULL DEFAULT '',
  whatsapp_url VARCHAR(500) NOT NULL DEFAULT '',
  website_url  VARCHAR(500) NOT NULL DEFAULT '',
  privacy_url  VARCHAR(500) NOT NULL DEFAULT ''
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
