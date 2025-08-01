// lib/actions/index.js
"use server";

import pool from "@/lib/db";

// Generic error handler
const handleError = (operation, entity, error) => {
  console.error(`Error ${operation} ${entity}:`, error);
  return { success: false, error: error.message };
};

// Generic success handler
const handleSuccess = (data = null, message = null) => {
  return { success: true, data, message };
};

// Base CRUD operations
class BaseActions {
  constructor(tableName) {
    this.tableName = tableName;
  }

  async getAll(orderBy = "id") {
    try {
      const [rows] = await pool.execute(
        `SELECT * FROM ${this.tableName} ORDER BY ${orderBy}`
      );
      return rows;
    } catch (error) {
      console.error(`Error fetching ${this.tableName}:`, error);
      return [];
    }
  }

  async getById(id) {
    try {
      const [rows] = await pool.execute(
        `SELECT * FROM ${this.tableName} WHERE id = ?`,
        [id]
      );
      return rows[0] || null;
    } catch (error) {
      console.error(`Error fetching ${this.tableName} by id:`, error);
      return null;
    }
  }

  async create(data) {
    try {
      const fields = Object.keys(data).join(", ");
      const placeholders = Object.keys(data)
        .map(() => "?")
        .join(", ");
      const values = Object.values(data);

      const [result] = await pool.execute(
        `INSERT INTO ${this.tableName} (${fields}) VALUES (${placeholders})`,
        values
      );

      return handleSuccess({ id: result.insertId });
    } catch (error) {
      return handleError("creating", this.tableName, error);
    }
  }

  async update(id, data) {
    try {
      const fields = Object.keys(data)
        .map((key) => `${key} = ?`)
        .join(", ");
      const values = [...Object.values(data), id];

      await pool.execute(
        `UPDATE ${this.tableName} SET ${fields} WHERE id = ?`,
        values
      );

      return handleSuccess();
    } catch (error) {
      return handleError("updating", this.tableName, error);
    }
  }

  async delete(id) {
    try {
      await pool.execute(`DELETE FROM ${this.tableName} WHERE id = ?`, [id]);
      return handleSuccess();
    } catch (error) {
      return handleError("deleting", this.tableName, error);
    }
  }
}

// Specific entity actions
export const divisionsActions = new BaseActions("divisions");
export const leaguesActions = new BaseActions("leagues");
export const mtsaPlayersActions = new BaseActions("mtsa_players");
export const seasonsActions = new BaseActions("seasons");
export const teamsActions = new BaseActions("teams");
export const usersActions = new BaseActions("users");

// Custom actions that need special handling
export const playersActions = {
  ...new BaseActions("players"),

  async getByTeamAndDivision(teamId, divisionId) {
    try {
      const [rows] = await pool.execute(
        "SELECT * FROM player_team_view WHERE team_id = ? AND division_id = ?",
        [teamId, divisionId]
      );
      return rows;
    } catch (error) {
      console.error("Error fetching players by team and division:", error);
      return [];
    }
  },
};

export const tnsoccerPlayerSeasonsActions = {
  ...new BaseActions("tnsoccer_player_seasons"),

  async getByPlayer(playerId) {
    try {
      const [rows] = await pool.execute(
        "SELECT * FROM tnsoccer_player_seasons WHERE player_id = ? ORDER BY season_id DESC",
        [playerId]
      );
      return rows;
    } catch (error) {
      console.error("Error fetching player seasons:", error);
      return [];
    }
  },
};

// Special user actions
export const userActions = {
  ...usersActions,

  async getByEmail(email) {
    try {
      const [rows] = await pool.execute("SELECT * FROM users WHERE email = ?", [
        email,
      ]);
      return rows[0] || null;
    } catch (error) {
      console.error("Error fetching user by email:", error);
      return null;
    }
  },

  async updatePassword(id, passwordHash) {
    try {
      await pool.execute("UPDATE users SET password_hash = ? WHERE id = ?", [
        passwordHash,
        id,
      ]);
      return handleSuccess();
    } catch (error) {
      return handleError("updating password for", "user", error);
    }
  },

  async updateLastLogin(id) {
    try {
      await pool.execute("UPDATE users SET last_login = NOW() WHERE id = ?", [
        id,
      ]);
      return handleSuccess();
    } catch (error) {
      return handleError("updating last login for", "user", error);
    }
  },
};
